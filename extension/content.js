;(() => {
  if (globalThis.__memeOnContent) return
  globalThis.__memeOnContent = true
  const { imageUrl, boundedBlob, dataUrl } = MemeOn
  let pointer = null
  let overlay = null

  document.addEventListener(
    'pointermove',
    (event) => {
      if (!event.isTrusted) return
      pointer = {
        x: event.clientX,
        y: event.clientY,
        at: performance.timeOrigin + performance.now(),
      }
    },
    { capture: true, passive: true },
  )
  document.addEventListener(
    'pointerout',
    (event) => {
      if (!event.relatedTarget) pointer = null
    },
    { capture: true, passive: true },
  )

  function findImage(x, y, root = document) {
    const elements = root.elementsFromPoint(x, y)
    for (const element of elements) {
      if (element.tagName === 'IFRAME' || element.tagName === 'FRAME') return null
      if (element.shadowRoot) {
        const nested = findImage(x, y, element.shadowRoot)
        if (nested) return nested
      }
      if (element instanceof HTMLImageElement) {
        const url = imageUrl(element.currentSrc || element.src, document.baseURI)
        if (url) return { url, element }
      }
      if (element instanceof HTMLCanvasElement && element.width && element.height)
        return { element }
      if (element instanceof SVGImageElement) {
        const url = imageUrl(element.href.baseVal, document.baseURI)
        if (url) return { url, element }
      }
      if (element instanceof SVGElement) {
        const svg = element.closest('svg')
        if (svg) return { element: svg, svg: true }
      }
      if (element instanceof HTMLInputElement && element.type === 'image') {
        const url = imageUrl(element.src, document.baseURI)
        if (url) return { url, element }
      }
      // A foreground label may sit over its parent's CSS background.
      const background = getComputedStyle(element).backgroundImage
      const match = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/.exec(background)
      const url = match && imageUrl(match[1] || match[2] || match[3].trim(), document.baseURI)
      if (url) return { url, element }
    }
    return null
  }

  async function sourceFor(image) {
    if (image.svg) {
      const clone = image.element.cloneNode(true)
      const rect = image.element.getBoundingClientRect()
      const width = Math.ceil(rect.width)
      const height = Math.ceil(rect.height)
      if (!width || !height || width * height > 40_000_000)
        throw new Error('This image is too large to convert.')
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clone.setAttribute('width', String(width))
      clone.setAttribute('height', String(height))
      const originals = [image.element, ...image.element.querySelectorAll('*')]
      const copies = [clone, ...clone.querySelectorAll('*')]
      originals.forEach((element, index) => {
        const css = getComputedStyle(element)
        for (const property of [
          'fill',
          'stroke',
          'stroke-width',
          'color',
          'font-family',
          'font-size',
        ])
          copies[index].style?.setProperty(property, css.getPropertyValue(property))
      })
      const url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }),
      )
      try {
        const raster = new Image()
        raster.src = url
        await raster.decode()
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(raster, 0, 0)
        return await sourceFor({ element: canvas })
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    if (image.url && !image.url.startsWith('blob:')) {
      if (image.url.startsWith('data:')) return image.url
      // Same-origin protected images can use the page's own session. Cross-origin CORS failures
      // fall back to the worker's host permission, without forwarding any site credentials.
      try {
        return await dataUrl(
          await boundedBlob(
            await fetch(image.url, {
              credentials: 'same-origin',
              signal: AbortSignal.timeout(15000),
            }),
          ),
        )
      } catch {
        return image.url
      }
    }
    if (image.url) {
      return dataUrl(
        await boundedBlob(await fetch(image.url, { signal: AbortSignal.timeout(15000) })),
      )
    }
    try {
      return await dataUrl(
        await new Promise((resolve, reject) =>
          image.element.toBlob((blob) => (blob ? resolve(blob) : reject(new Error())), 'image/png'),
        ),
      )
    } catch {
      throw new Error(
        'This canvas is protected by the website. Try saving the image and using Upload on MemeOn.',
      )
    }
  }

  function close() {
    overlay?.dispose()
    overlay = null
  }

  async function send(message) {
    const result = await chrome.runtime.sendMessage(message)
    if (result?.error) throw new Error(result.error)
    return result
  }

  function show(image) {
    close()
    const host = document.createElement('div')
    host.setAttribute('data-memeon-extension', '')
    const shadow = host.attachShadow({ mode: 'closed' })
    const style = document.createElement('style')
    style.textContent = `
      :host { all: initial !important; }
      .panel { all: initial; position: fixed; inset: auto; margin: 0; box-sizing: border-box;
        width: 310px; max-width: calc(100vw - 16px); padding: 12px; background: #fffdf9;
        color: #242228; border: 1px solid #bdb7ae; border-radius: 18px;
        box-shadow: 0 8px 32px #0003; font: 14px/1.4 system-ui,sans-serif; z-index: 2147483647; }
      .row { display: flex; align-items: center; gap: 9px; }
      button { font: 600 14px/1.2 system-ui,sans-serif; border: 0; cursor: pointer;
        border-radius: 11px; padding: 11px; background: #eee8dd; color: #242228; }
      button:focus-visible { outline: 3px solid #4055d4; outline-offset: 2px; }
      button:disabled { opacity: .5; cursor: not-allowed; }
      .mint { display: flex; align-items: center; justify-content: center; gap: 7px;
        flex: 1; background: #282332; color: white; white-space: nowrap; }
      .mint img { width: 28px; height: 28px; }
      .avatar { display: flex; align-items: center; justify-content: center;
        width: 36px; height: 36px; border-radius: 50%; background: #e5deef;
        overflow: hidden; font-weight: 700; flex-shrink: 0; }
      .avatar img { width: 100%; height: 100%; object-fit: cover; }
      .close { padding: 7px; background: transparent; font-size: 20px; line-height: 1; }
      .status { margin: 9px 2px 0; font: 12px/1.4 system-ui,sans-serif; overflow-wrap: anywhere; }
      [hidden] { display: none !important; }
    `
    const panel = document.createElement('section')
    panel.className = 'panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', 'MemeOn image')
    panel.setAttribute('popover', 'manual')
    panel.style.left = `${Math.max(8, Math.min(pointer?.x ?? 16, innerWidth - 326))}px`
    panel.style.top = `${Math.max(8, Math.min((pointer?.y ?? 16) + 18, innerHeight - 160))}px`
    const row = document.createElement('div')
    row.className = 'row'
    const avatar = document.createElement('span')
    avatar.className = 'avatar'
    avatar.hidden = true
    const mint = document.createElement('button')
    mint.type = 'button'
    mint.className = 'mint'
    mint.disabled = true
    const logo = document.createElement('img')
    logo.src = chrome.runtime.getURL('icons/brain-48.png')
    logo.alt = ''
    mint.append(logo, document.createTextNode('MemeOn!'))
    const login = document.createElement('button')
    login.type = 'button'
    login.textContent = 'Log in'
    login.hidden = true
    const dismiss = document.createElement('button')
    dismiss.type = 'button'
    dismiss.className = 'close'
    dismiss.textContent = '×'
    dismiss.setAttribute('aria-label', 'Close MemeOn')
    const status = document.createElement('p')
    status.className = 'status'
    status.setAttribute('role', 'status')
    status.textContent = image
      ? 'Checking your MemeOn login…'
      : 'Hover over an image, then press your MemeOn shortcut.'
    row.append(avatar, mint, login, dismiss)
    panel.append(row, status)
    shadow.append(style, panel)
    document.documentElement.append(host)
    panel.showPopover()
    let disposed = false
    let busy = false
    let checking = false
    let user = null
    let lastProfile

    function paint(next) {
      user = next
      avatar.replaceChildren()
      avatar.hidden = !user
      login.hidden = !!user
      mint.disabled = !user || !image || busy
      if (user) {
        avatar.title = user.name
        avatar.setAttribute('aria-label', `Signed in as ${user.name}`)
        avatar.textContent = user.name.trim().slice(0, 1).toUpperCase()
        if (user.picture) {
          const photo = document.createElement('img')
          photo.alt = user.name
          photo.referrerPolicy = 'no-referrer'
          photo.src = user.picture
          photo.addEventListener(
            'error',
            () => {
              photo.remove()
            },
            { once: true },
          )
          avatar.append(photo)
          // Keep the initial behind the photo only as a fallback.
          photo.style.position = 'absolute'
          avatar.style.position = 'relative'
        }
      }
    }
    async function refresh() {
      if (disposed || busy || checking || !image) return
      checking = true
      try {
        const result = await send({ type: 'session' })
        if (disposed) return
        const signature = JSON.stringify(result.user)
        if (signature !== lastProfile) {
          lastProfile = signature
          paint(result.user)
          status.textContent = user
            ? `Create with ${user.name}`
            : 'Log in to MemeOn, then return here to continue.'
        }
      } catch (error) {
        if (!disposed) {
          lastProfile = undefined
          paint(null)
          status.textContent = error.message
        }
      } finally {
        checking = false
      }
    }
    mint.addEventListener('click', async (event) => {
      if (!event.isTrusted || busy || !user || !image) return
      busy = true
      mint.disabled = true
      status.textContent = 'Opening your mint desk…'
      try {
        const result = await send({ type: 'open', source: await sourceFor(image) })
        if (disposed) return
        if (result.loginRequired) {
          lastProfile = undefined
          paint(null)
          status.textContent = 'Your session ended. Log in to continue.'
        } else close()
      } catch (error) {
        if (!disposed) status.textContent = error.message
      } finally {
        busy = false
        if (!disposed) mint.disabled = !user || !image
      }
    })
    login.addEventListener('click', async (event) => {
      if (!event.isTrusted) return
      try {
        await send({ type: 'login' })
      } catch (error) {
        status.textContent = error.message
      }
    })
    dismiss.addEventListener('click', close)
    const escape = (event) => {
      if (event.key === 'Escape') close()
    }
    const outside = (event) => {
      if (!event.composedPath().includes(host)) close()
    }
    const focus = () => {
      void refresh()
    }
    document.addEventListener('keydown', escape, true)
    document.addEventListener('pointerdown', outside, true)
    window.addEventListener('focus', focus)
    const interval = setInterval(() => {
      if (!document.hidden) void refresh()
    }, 5000)
    overlay = {
      dispose() {
        disposed = true
        clearInterval(interval)
        document.removeEventListener('keydown', escape, true)
        document.removeEventListener('pointerdown', outside, true)
        window.removeEventListener('focus', focus)
        host.remove()
      },
    }
    void refresh()
  }

  // The worker picks the frame with the newest real pointer event. Parent documents may keep
  // stale :hover/pointer coordinates when crossing an out-of-process iframe boundary.
  globalThis.__memeOnTarget = () => {
    if (pointer) return { at: pointer.at }
    const hovered = [...document.querySelectorAll(':hover')].at(-1)
    if (!hovered || ['HTML', 'BODY', 'IFRAME', 'FRAME'].includes(hovered.tagName)) return null
    const rect = hovered.getBoundingClientRect()
    pointer = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, at: 0 }
    return { at: 0 }
  }
  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message?.type !== 'show') return
    respond({ ready: true })
    if (overlay) {
      close()
      return
    }
    show(pointer ? findImage(pointer.x, pointer.y) : null)
  })
})()
