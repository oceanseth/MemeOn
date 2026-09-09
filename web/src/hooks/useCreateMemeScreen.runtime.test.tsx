import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateMemeRoute } from '../App'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

function pathOf(input: RequestInfo | URL): string {
  const value = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  return new URL(value, window.location.origin).pathname
}

function bodyOf(init?: RequestInit): Record<string, unknown> {
  return init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {}
}

async function settle(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

/** A macrotask that survives fake timers, so React's lazy route can actually resolve. */
function macrotask(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => resolve()
    channel.port2.postMessage(null)
  })
}

function CurrentRoute() {
  return <output aria-label="Current route">{useLocation().pathname}</output>
}

function CreationRoutes() {
  return (
    <>
      <Routes>
        <Route path="/binder/new" element={<CreateMemeRoute />} />
        <Route path="/m/:id" element={null} />
      </Routes>
      <CurrentRoute />
    </>
  )
}

let host: HTMLDivElement
let root: Root

beforeEach(async () => {
  /* the route view is lazy: pull its module in before any test installs fake timers */
  await import('../views/CreateMemeView')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  sessionStorage.clear()
})

afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
  sessionStorage.clear()
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function renderAt(): Promise<void> {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/binder/new']}>
        <CreationRoutes />
      </MemoryRouter>,
    )
    await settle()
  })
  /* the route view is lazy: wait for the mounted form rather than guessing a tick count */
  for (let attempt = 0; attempt < 20 && !host.querySelector('.form-grid'); attempt += 1) {
    await act(async () => {
      await macrotask()
      await settle()
    })
  }
}

function setControlValue(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(control), 'value')
  descriptor?.set?.call(control, value)
  control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
}

function button(label: string, occurrence: 'first' | 'last' = 'first'): HTMLButtonElement {
  const matches = [...host.querySelectorAll<HTMLButtonElement>('button')]
    .filter((candidate) => candidate.textContent?.includes(label))
  const found = occurrence === 'first' ? matches[0] : matches.at(-1)
  if (!found) throw new Error(`Missing button: ${label}`)
  return found
}

async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click()
    await settle()
  })
}

async function change(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): Promise<void> {
  await act(async () => {
    setControlValue(control, value)
    await settle()
  })
}

describe('CreateMemeRoute settling requests', () => {
  it('locks the mode row while a render runs and keeps the artwork across a later switch', async () => {
    const image = deferred<Response>()
    vi.stubGlobal('fetch', vi.fn<typeof fetch>((input) => {
      if (pathOf(input) === '/api/aigen/image') return image.promise
      throw new Error(`Unexpected request: ${pathOf(input)}`)
    }))
    await renderAt()

    await change(host.querySelector<HTMLInputElement>('#create-title')!, 'pending image')
    await change(host.querySelector<HTMLTextAreaElement>('textarea[placeholder^="a capybara"]')!, 'draw it')
    await click(button('Render the image'))
    expect(button('Upload').disabled).toBe(true)
    await act(async () => {
      image.resolve(Response.json({ imageUrl: '/finished.png' }))
      await settle()
    })
    await click(button('Upload'))

    expect(button('Upload').getAttribute('aria-pressed')).toBe('true')
    expect(host.querySelector<HTMLImageElement>('img.meme-art')?.getAttribute('src')).toBe('/finished.png')
    expect(host.querySelector('.form-grid')?.getAttribute('aria-busy')).toBe('false')
    expect(button('Mint').disabled).toBe(false)
    expect(host.textContent).not.toContain('Rendering your masterpiece')
  })

  it('clears busy, shows the error with a next step, and permits retry after a mode switch', async () => {
    const image = deferred<Response>()
    vi.stubGlobal('fetch', vi.fn<typeof fetch>((input) => {
      if (pathOf(input) === '/api/aigen/image') return image.promise
      throw new Error(`Unexpected request: ${pathOf(input)}`)
    }))
    await renderAt()

    await change(host.querySelector<HTMLTextAreaElement>('textarea[placeholder^="a capybara"]')!, 'draw it')
    await click(button('Render the image'))
    await act(async () => {
      image.resolve(Response.json({ error: 'credits exhausted' }, { status: 402 }))
      await settle()
    })

    expect(host.querySelector('[role="alert"]')?.textContent).toContain('credits exhausted')
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Top up Masky credits')
    expect(host.querySelector('.form-grid')?.getAttribute('aria-busy')).toBe('false')
    expect(host.textContent).not.toContain('Rendering your masterpiece')
    await click(button('Upload'))
    await click(button('Generate image'))
    expect(button('Generate image').getAttribute('aria-pressed')).toBe('true')
    expect(button('Render the image').disabled).toBe(false)
  })

  it('holds the minted card with its share link instead of navigating away', async () => {
    const mint = deferred<Response>()
    const mintBodies: Record<string, unknown>[] = []
    vi.stubGlobal('fetch', vi.fn<typeof fetch>((input, init) => {
      const path = pathOf(input)
      if (path === '/api/aigen/image') return Promise.resolve(Response.json({ imageUrl: '/generated.png' }))
      if (path === '/api/memes') {
        mintBodies.push(bodyOf(init))
        return mint.promise
      }
      throw new Error(`Unexpected request: ${path}`)
    }))
    await renderAt()

    await change(host.querySelector<HTMLInputElement>('#create-title')!, 'original title')
    await change(host.querySelector<HTMLTextAreaElement>('textarea[placeholder^="a capybara"]')!, 'draw it')
    await click(button('Render the image'))
    await click(button('Mint'))
    expect(button('Upload').disabled).toBe(true)
    await act(async () => {
      mint.resolve(Response.json({ meme: { id: 'minted-original' } }))
      await settle()
    })

    expect(mintBodies).toEqual([expect.objectContaining({
      title: 'original title', imageUrl: '/generated.png', mediaType: 'image', videoUrl: null, source: null,
    })])
    expect(host.textContent).toContain('Minted')
    expect(host.querySelector<HTMLInputElement>('input[readonly]')?.value)
      .toBe(`${window.location.origin}/m/minted-original`)
    expect(host.querySelector('output[aria-label="Current route"]')?.textContent).toBe('/binder/new')

    const open = [...host.querySelectorAll('a')].find((a) => a.textContent === 'Open the card')!
    await click(open)
    expect(host.querySelector('output[aria-label="Current route"]')?.textContent).toBe('/m/minted-original')
  })
})
