import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const requireWeb = createRequire(resolve(root, 'web/package.json'))
const { chromium } = requireWeb('playwright')
const appOrigin = 'http://localhost:5173'
const fixtureOrigin = 'http://127.0.0.1:4178'
const output = resolve(root, 'extension/test-results')
const extension = resolve(output, 'unpacked')
await mkdir(output, { recursive: true })
await cp(resolve(root, 'extension/dist/production'), extension, { recursive: true })
await writeFile(resolve(extension, 'config.js'), `globalThis.MEMEON_ORIGIN = '${appOrigin}'\n`)
const png = await readFile(resolve(root, 'extension/icons/brain-48.png'))
const fixture = createServer((req, res) => {
  if (req.url.endsWith('.png')) {
    if (req.url === '/blocked.png') {
      res.writeHead(403)
      res.end()
      return
    }
    res.setHeader('Content-Type', 'image/png')
    res.end(png)
    return
  }
  res.setHeader('Content-Type', 'text/html')
  if (req.url === '/frame') {
    res.end('<img id="framed" src="/framed.png" width="160" height="160">')
    return
  }
  res.end(`<!doctype html><style>body{margin:30px;font:20px system-ui}img,.background,canvas{width:160px;height:160px;margin:10px}.background{display:inline-block;background-image:url('/background.png')}iframe{width:200px;height:200px} .cover{position:absolute;width:160px;height:160px;left:40px;top:40px}</style>
    <img id="normal" src="/normal.png"><div class="cover"></div>
    <img id="responsive" src="/fallback.png" srcset="/responsive.png 1x, /retina.png 2x">
    <div id="background" class="background"></div><img id="blob"><canvas id="canvas" width="64" height="64"></canvas>
    <iframe src="http://localhost:4178/frame"></iframe><div id="shadow"></div><svg id="svg" width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" fill="purple"/></svg><img id="cross" src="http://localhost:4178/cross.png">
    <script>
      fetch('/blob.png').then(r=>r.blob()).then(b=>document.querySelector('#blob').src=URL.createObjectURL(b));
      document.querySelector('canvas').getContext('2d').fillRect(0,0,64,64);
      document.querySelector('#shadow').attachShadow({mode:'open'}).innerHTML='<img id="shadowImage" src="/shadow.png" width="160" height="160">';
    </script>`)
})
await new Promise((resolve) => fixture.listen(4178, resolve))
let viteLog = ''
const vite = spawn(
  process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
  process.platform === 'win32'
    ? ['/d', '/s', '/c', 'pnpm run dev:web -- --host 127.0.0.1 --port 5173 --strictPort']
    : ['run', 'dev:web', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
  {
    cwd: root,
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
)
vite.stdout.on('data', (data) => {
  viteLog += data
})
vite.stderr.on('data', (data) => {
  viteLog += data
})
async function poll(fn, timeout = 20000) {
  const end = Date.now() + timeout
  let last
  while (Date.now() < end) {
    try {
      const value = await fn()
      if (value) return value
    } catch (error) {
      last = error
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw last || new Error('Timed out waiting for browser state')
}
let context
try {
  await poll(async () => (await fetch(appOrigin)).ok)
  if (vite.exitCode !== null) throw new Error(viteLog)
  context = await chromium.launchPersistentContext(resolve(output, `profile-${Date.now()}`), {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  })
  let loggedIn = false
  let uploads = 0
  let uploadBytes = 0
  const user = {
    sub: 'extension-test',
    name: 'Extension Tester',
    picture: `${fixtureOrigin}/avatar.png`,
    coins: 100,
    portfolioValue: 0,
    collectionSize: 0,
    unreadAlerts: 0,
    onboarding: {},
  }
  await context.route(`${appOrigin}/api/**`, async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/me') {
      await route.fulfill({
        status: loggedIn ? 200 : 401,
        json: loggedIn ? user : { error: 'expired' },
      })
      return
    }
    if (url.pathname === '/api/uploads') {
      uploads++
      await route.fulfill({
        json: { uploadUrl: `${appOrigin}/test-put`, publicUrl: `${fixtureOrigin}/uploaded.png` },
      })
      return
    }
    await route.fulfill({ json: { alerts: [], quests: [], memes: [], friends: [], rows: [] } })
  })
  await context.route(`${appOrigin}/test-put`, async (route) => {
    uploadBytes += route.request().postDataBuffer()?.length || 0
    await route.fulfill({ status: 200, body: '' })
  })
  const worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'))
  const commands = await worker.evaluate(() => chrome.commands.getAll())
  assert.equal(commands.find((c) => c.name === 'memeon-image').shortcut, 'Alt+Shift+M')
  console.log('PASS Chrome registers Alt+Shift+M')
  const site = await context.newPage()
  await site.goto(appOrigin)
  const page = await context.newPage()
  await page.goto(fixtureOrigin)
  const cdp = await context.newCDPSession(page)
  async function nodes() {
    const { root: document } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true })
    const flat = []
    function visit(node) {
      flat.push(node)
      for (const child of [
        ...(node.children || []),
        ...(node.shadowRoots || []),
        ...(node.contentDocument ? [node.contentDocument] : []),
      ])
        visit(child)
    }
    visit(document)
    return flat
  }
  function textOf(node) {
    return (node.nodeValue || '') + (node.children || []).map(textOf).join('')
  }
  async function button(label) {
    return (await nodes()).find((node) => node.nodeName === 'BUTTON' && textOf(node) === label)
  }
  async function uiText() {
    return (await nodes())
      .filter((n) => n.nodeName === '#text')
      .map((n) => n.nodeValue)
      .join(' ')
  }
  async function click(label) {
    const node = await poll(() => button(label))
    const { model } = await cdp.send('DOM.getBoxModel', { nodeId: node.nodeId })
    const q = model.content
    await page.mouse.click((q[0] + q[4]) / 2, (q[1] + q[5]) / 2)
  }
  async function command() {
    await worker.evaluate(async (url) => {
      const tabs = await chrome.tabs.query({ url: `${url}/*` })
      await handleCommand('memeon-image', tabs[0])
    }, fixtureOrigin)
  }
  async function hover(selector) {
    await page.bringToFront()
    const box = await page.locator(selector).boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await command()
    await poll(() => button('MemeOn!'))
  }
  await hover('#normal')
  await poll(async () => (await uiText()).includes('Log in to MemeOn'))
  assert.ok((await button('MemeOn!')).attributes.includes('disabled'))
  await page.screenshot({ path: resolve(output, 'signed-out.png') })
  console.log('PASS logged-out overlay disables MemeOn and offers Log in')
  await click('Log in')
  await site.evaluate(() => localStorage.setItem('memeon_session', 'test-only-session'))
  loggedIn = true
  await page.bringToFront()
  await poll(async () => (await uiText()).includes('Create with Extension Tester'))
  assert.ok(!(await button('MemeOn!')).attributes.includes('disabled'))
  await page.screenshot({ path: resolve(output, 'signed-in.png') })
  console.log('PASS login enables the original overlay and shows current avatar')
  const session = await worker.evaluate(() => getSession())
  assert.deepEqual(Object.keys(session.user).sort(), ['name', 'picture', 'sub'])
  assert.ok(!JSON.stringify(session).includes('test-only-session'))
  console.log('PASS site credentials never leave the isolated profile check')
  await click('MemeOn!')
  const destination = await poll(() =>
    context.pages().find((p) => p.url() === `${appOrigin}/binder/new`),
  )
  await destination.locator('img[data-slot="meme-art"]').waitFor()
  assert.equal(uploads, 1)
  assert.equal(uploadBytes, png.length)
  assert.equal(
    await destination.locator('img[data-slot="meme-art"]').getAttribute('src'),
    `${fixtureOrigin}/uploaded.png`,
  )
  await destination.screenshot({ path: resolve(output, 'mint-desk.png') })
  console.log('PASS actual MemeOn mint desk uploads selected bytes and shows image preview')
  await destination.close()
  for (const selector of [
    '#responsive',
    '#background',
    '#blob',
    '#canvas',
    '#shadowImage',
    '#svg',
    '#cross',
  ]) {
    await hover(selector)
    await poll(async () => (await uiText()).includes('Create with Extension Tester'))
    await click('MemeOn!')
    const target = await poll(() =>
      context.pages().find((p) => p.url() === `${appOrigin}/binder/new`),
    )
    await target.locator('img[data-slot="meme-art"]').waitFor()
    await target.close()
    console.log(`PASS ${selector} imports into mint desk`)
  }
  // Cross-origin frame gets one overlay; the top frame stays empty.
  await page.bringToFront()
  const frame = page.frames().find((f) => f.url().includes('/frame'))
  await frame.locator('#framed').hover()
  await command()
  await poll(async () => await frame.locator('[data-memeon-extension]').count())
  assert.equal(await page.locator('[data-memeon-extension]').count(), 0)
  console.log('PASS cross-origin iframe receives overlay without a duplicate in parent')
  await frame.locator('body').press('Escape')
  await hover('#normal')
  await poll(async () => (await uiText()).includes('Create with Extension Tester'))
  loggedIn = false
  await click('MemeOn!')
  await poll(async () => (await uiText()).includes('Your session ended'))
  assert.ok((await button('MemeOn!')).attributes.includes('disabled'))
  console.log('PASS expired session is rechecked at click and cannot open a mint')
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('[data-memeon-extension]').count(), 0)
  // Handoff records are bound to a destination tab, never available to arbitrary pages.
  const denial = await worker.evaluate(async () => {
    try {
      await handleMessage(
        { type: 'pending' },
        { id: chrome.runtime.id, tab: { id: 123 }, frameId: 0, url: 'https://unrelated.example/' },
      )
      return false
    } catch {
      return true
    }
  })
  assert.equal(denial, true)
  console.log('PASS unrelated origins cannot retrieve pending images')
  const boundaryChecks = await worker.evaluate(async () => {
    const sender = {
      id: chrome.runtime.id,
      tab: { id: 999999 },
      frameId: 0,
      url: MEMEON_ORIGIN + '/binder/new',
    }
    const results = []
    for (const invalid of [
      { ...sender, id: 'another-extension' },
      { ...sender, frameId: 1 },
      { ...sender, url: MEMEON_ORIGIN + '.evil.example/binder/new' },
    ]) {
      try {
        await handleMessage({ type: 'pending' }, invalid)
        results.push(false)
      } catch {
        results.push(true)
      }
    }
    await PendingImages.put({ tabId: sender.tab.id, sub: 'u', data: 'data:image/png;base64,eA==' })
    results.push(!!(await PendingImages.get(sender.tab.id)))
    results.push(
      (await handleMessage({ type: 'pending' }, { ...sender, tab: { id: 999998 } })).image === null,
    )
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('memeon-handoff', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    async function alter(changes) {
      const record = await PendingImages.get(sender.tab.id)
      await new Promise((resolve, reject) => {
        const tx = db.transaction('images', 'readwrite')
        tx.objectStore('images').put({ ...record, ...changes })
        tx.oncomplete = resolve
        tx.onerror = () => reject(tx.error)
      })
    }
    await alter({ createdAt: Date.now() - 11 * 60 * 1000 })
    results.push((await PendingImages.get(sender.tab.id)) === null)
    await PendingImages.put({ tabId: sender.tab.id, sub: 'u' })
    await alter({ sessionId: 'a-previous-browser-session' })
    results.push((await PendingImages.get(sender.tab.id)) === null)
    db.close()
    try {
      await fetchImage('http://127.0.0.1:4178/blocked.png')
      results.push(false)
    } catch (error) {
      results.push(error.message.includes('did not allow'))
    }
    return results
  })
  assert.ok(boundaryChecks.every(Boolean), JSON.stringify(boundaryChecks))
  console.log(
    'PASS sender/frame/origin/tab boundaries, handoff expiry, browser-session isolation, and refused downloads',
  )
  await site.close()
  const reopened = await worker.evaluate(() => getSession())
  assert.equal(reopened.user, null)
  const tabExists = await worker.evaluate(
    async (id) => (await chrome.tabs.get(id)).url,
    reopened.tabId,
  )
  assert.ok(tabExists.startsWith(appOrigin))
  console.log('PASS login check opens a background MemeOn tab when none exists')
  console.log(`All extension browser scenarios passed. Screenshots: ${output}`)
} finally {
  await context?.close()
  await new Promise((resolve) => fixture.close(resolve))
  if (process.platform === 'win32')
    spawn('taskkill', ['/PID', String(vite.pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    })
  else vite.kill('SIGTERM')
  await writeFile(resolve(output, 'vite.log'), viteLog)
}
