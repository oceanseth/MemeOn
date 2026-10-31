;(() => {
  if (location.origin !== MEMEON_ORIGIN || window !== window.top || globalThis.__memeOnBridge)
    return
  globalThis.__memeOnBridge = true
  async function send(type) {
    const result = await chrome.runtime.sendMessage({ type })
    if (result?.error) throw new Error(result.error)
    return result
  }
  function waitForPicker() {
    return new Promise((resolve, reject) => {
      const observer = new MutationObserver(check)
      const timer = setTimeout(() => {
        observer.disconnect()
        reject(new Error('Open Mint → Upload, then press Retry here.'))
      }, 20000)
      function check() {
        const input = document.querySelector(
          '[data-slot="create-meme-upload-panel"] input[type="file"][accept^="image/"]',
        )
        if (input && !input.disabled) {
          clearTimeout(timer)
          observer.disconnect()
          resolve(input)
          return
        }
        const upload = [...document.querySelectorAll('[data-slot="mint-modes"] button')].find(
          (button) => button.textContent.trim() === 'Upload',
        )
        if (upload && !upload.disabled && upload.getAttribute('aria-pressed') !== 'true')
          upload.click()
      }
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
      })
      check()
    })
  }
  async function run() {
    const { image } = await send('pending')
    if (!image) return
    const host = document.createElement('div')
    host.setAttribute('data-memeon-import', '')
    const root = host.attachShadow({ mode: 'closed' })
    const style = document.createElement('style')
    style.textContent =
      ':host{all:initial!important}section{position:fixed;bottom:20px;right:20px;z-index:2147483647;max-width:340px;padding:16px;background:#fffdf9;color:#242228;border:1px solid #bdb7ae;border-radius:14px;box-shadow:0 5px 24px #0003;font:14px/1.5 system-ui}button{margin:8px 8px 0 0;padding:8px 12px;border:0;border-radius:8px;background:#282332;color:#fff;cursor:pointer;font:600 13px system-ui}button:focus-visible{outline:3px solid #4055d4}[hidden]{display:none}'
    const panel = document.createElement('section')
    const status = document.createElement('div')
    status.setAttribute('role', 'status')
    const retry = document.createElement('button')
    retry.textContent = 'Retry'
    const cancel = document.createElement('button')
    cancel.textContent = 'Dismiss'
    panel.append(status, retry, cancel)
    root.append(style, panel)
    document.documentElement.append(host)
    let working = false
    let cancelled = false
    cancel.addEventListener('click', () => {
      cancelled = true
      void send('delivered').catch(() => {})
      host.remove()
    })
    async function deliver() {
      if (working || cancelled) return
      working = true
      retry.hidden = true
      status.textContent = 'Preparing your selected image…'
      try {
        const { user } = await send('session')
        if (cancelled) return
        if (!user) throw new Error('Log in to MemeOn, then press Retry to bring in your image.')
        if (user.sub !== image.sub)
          throw new Error(
            'Your MemeOn account changed. Return to the image and select it again with this account.',
          )
        if (location.pathname !== '/binder/new') {
          location.assign('/binder/new')
          return
        }
        const input = await waitForPicker()
        if (cancelled) return
        const blob = await (await fetch(image.data)).blob()
        const transfer = new DataTransfer()
        transfer.items.add(new File([blob], image.name, { type: blob.type }))
        input.files = transfer.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
        await send('delivered')
        host.remove()
      } catch (error) {
        if (!cancelled) {
          status.textContent = error.message
          retry.hidden = false
        }
      } finally {
        working = false
      }
    }
    retry.addEventListener('click', () => {
      void deliver()
    })
    await deliver()
  }
  void run().catch(() => {
    /* extension reloaded or page navigated away */
  })
})()
