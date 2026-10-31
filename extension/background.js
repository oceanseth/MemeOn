importScripts('config.js', 'shared.js', 'pending.js')
const { imageUrl, profile, boundedBlob, dataUrl, MIME_EXTENSIONS, MAX_DATA_LENGTH } = MemeOn
const ORIGIN = MEMEON_ORIGIN
let openingSessionTab

function isMemeOn(url) {
  try {
    return new URL(url).origin === ORIGIN
  } catch {
    return false
  }
}

async function waitForTab(tabId) {
  if ((await chrome.tabs.get(tabId)).status === 'complete') return
  await new Promise((resolve, reject) => {
    const finish = (error) => {
      clearTimeout(timer)
      chrome.tabs.onUpdated.removeListener(updated)
      chrome.tabs.onRemoved.removeListener(removed)
      error ? reject(error) : resolve()
    }
    const updated = (id, info) => {
      if (id === tabId && info.status === 'complete') finish()
    }
    const removed = (id) => {
      if (id === tabId) finish(new Error('The MemeOn tab was closed.'))
    }
    const timer = setTimeout(
      () => finish(new Error('MemeOn took too long to load. Please try again.')),
      15000,
    )
    chrome.tabs.onUpdated.addListener(updated)
    chrome.tabs.onRemoved.addListener(removed)
    // Close the race between tabs.get and installing the listener.
    chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (tab.status === 'complete') finish()
      })
      .catch(finish)
  })
}

async function sessionTab() {
  const tabs = await chrome.tabs.query({ url: `${ORIGIN}/*` })
  const existing = tabs.find((tab) => tab.active) || tabs[0]
  if (existing) {
    await waitForTab(existing.id)
    return existing
  }
  if (!openingSessionTab) {
    openingSessionTab = (async () => {
      const tab = await chrome.tabs.create({ url: ORIGIN, active: false })
      await waitForTab(tab.id)
      return tab
    })().finally(() => {
      openingSessionTab = null
    })
  }
  return openingSessionTab
}

/* Serialized into the site's ISOLATED world. Only public profile fields leave this function.
   Check the origin before touching localStorage, including after a redirect/navigation. */
async function readSiteProfile(origin) {
  if (location.origin !== origin) throw new Error('Open MemeOn and try again.')
  const token = localStorage.getItem('memeon_session')
  if (!token) return { status: 'signed-out', user: null }
  const response = await fetch('/api/me', {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  })
  if (localStorage.getItem('memeon_session') !== token) return { status: 'signed-out', user: null }
  if (response.status === 401) return { status: 'signed-out', user: null }
  if (!response.ok) throw new Error('Could not check your MemeOn login. Try again.')
  const user = await response.json()
  return { status: 'signed-in', user: { sub: user.sub, name: user.name, picture: user.picture } }
}

async function getSession() {
  const tab = await sessionTab()
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'ISOLATED',
    func: readSiteProfile,
    args: [ORIGIN],
  })
  if (!result?.result) throw new Error('Could not check your MemeOn login. Try again.')
  const user = profile(result.result.user)
  return { user, tabId: tab.id }
}

async function fetchImage(source) {
  const url = imageUrl(source)
  if (!url || url.startsWith('blob:'))
    throw new Error('This image cannot be copied. Try saving it and using Upload on MemeOn.')
  const response = await fetch(url, {
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(15000),
  })
  let blob = await boundedBlob(response)
  // Unsupported DOM formats become PNG; GIF/WebP animation remains intact.
  if (!MIME_EXTENSIONS[blob.type]) {
    let bitmap
    try {
      bitmap = await createImageBitmap(blob)
      if (!bitmap.width || bitmap.width * bitmap.height > 40_000_000)
        throw new Error('This image is too large to convert.')
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      canvas.getContext('2d').drawImage(bitmap, 0, 0)
      blob = await canvas.convertToBlob({ type: 'image/png' })
    } catch {
      throw new Error('This image format could not be copied. Try saving it as PNG or JPEG.')
    } finally {
      bitmap?.close()
    }
  }
  return { data: await dataUrl(blob), name: `memeon-image.${MIME_EXTENSIONS[blob.type]}` }
}

async function openMeme(source) {
  const session = await getSession()
  if (!session.user) return { user: null, loginRequired: true }
  const image = await fetchImage(source)
  const tab = await chrome.tabs.create({ url: 'about:blank', active: false })
  try {
    await PendingImages.put({ tabId: tab.id, sub: session.user.sub, ...image })
    await chrome.tabs.update(tab.id, { url: `${ORIGIN}/binder/new`, active: true })
  } catch (error) {
    await PendingImages.remove(tab.id)
    await chrome.tabs.remove(tab.id).catch(() => {})
    throw error
  }
  return { opened: true }
}

async function handleMessage(message, sender) {
  if (
    sender.id !== chrome.runtime.id ||
    !sender.tab ||
    !message ||
    typeof message.type !== 'string'
  )
    throw new Error('Unsupported request.')
  switch (message.type) {
    case 'session':
      return getSession()
    case 'login': {
      const tab = await sessionTab()
      await chrome.tabs.update(tab.id, { active: true })
      await chrome.windows.update(tab.windowId, { focused: true })
      return { opened: true }
    }
    case 'open':
      if (typeof message.source !== 'string' || message.source.length > MAX_DATA_LENGTH)
        throw new Error('Choose an image smaller than 8 MB.')
      return openMeme(message.source)
    case 'pending':
    case 'delivered': {
      if (sender.frameId !== 0 || !isMemeOn(sender.url)) throw new Error('Unsupported destination.')
      if (message.type === 'delivered') {
        await PendingImages.remove(sender.tab.id)
        return {}
      }
      return { image: await PendingImages.get(sender.tab.id) }
    }
    default:
      throw new Error('Unsupported request.')
  }
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  handleMessage(message, sender)
    .then(respond)
    .catch((error) => respond({ error: error.message || 'Please try again.' }))
  return true
})

async function handleCommand(command, tab) {
  if (command !== 'memeon-image') return
  const target = tab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  if (!target?.id) return
  try {
    const probe = () =>
      chrome.scripting.executeScript({
        target: { tabId: target.id, allFrames: true },
        func: () => ({
          installed: !!globalThis.__memeOnTarget,
          pointer: globalThis.__memeOnTarget?.(),
        }),
      })
    let frames = await probe()
    if (frames.some((frame) => !frame.result?.installed)) {
      await chrome.scripting.executeScript({
        target: { tabId: target.id, allFrames: true },
        files: ['config.js', 'shared.js', 'content.js', 'bridge.js'],
      })
      frames = await probe()
    }
    const selected = frames
      .filter((frame) => frame.result?.pointer)
      .sort((a, b) => b.result.pointer.at - a.result.pointer.at || b.frameId - a.frameId)[0]
    if (selected)
      await chrome.tabs.sendMessage(target.id, { type: 'show' }, { frameId: selected.frameId })
    await chrome.action.setBadgeText({ tabId: target.id, text: '' })
  } catch {
    await chrome.action.setBadgeText({ tabId: target.id, text: '!' })
    await chrome.action.setTitle({
      tabId: target.id,
      title:
        'Chrome blocks extensions on this page. Open a regular website, then hover an image and press Alt+Shift+M.',
    })
  }
}
chrome.commands.onCommand.addListener(handleCommand)
chrome.action.onClicked.addListener((tab) => handleCommand('memeon-image', tab))
chrome.tabs.onRemoved.addListener((tabId) => {
  void PendingImages.remove(tabId)
})
void PendingImages.prune()
