import { StrictMode } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateMemeRoute } from '../App'
import { PENDING_VIDEO_KEY } from './useCreateMemeScreen'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
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

function CreationRoutes() {
  return (
    <>
      <nav>
        <Link to="/binder/new?remix=remix-a">Remix A</Link>
        <Link to="/binder/new?remix=remix-b">Remix B</Link>
        <Link to="/away">Away</Link>
      </nav>
      <Routes>
        <Route path="/binder/new" element={<CreateMemeRoute />} />
        <Route path="/away" element={<p>Elsewhere</p>} />
      </Routes>
    </>
  )
}

const sourceMeme = (id: string) => ({
  id,
  title: id,
  description: null,
  mediaType: 'video' as const,
  imageUrl: `/${id}.png`,
  videoUrl: `/${id}.mp4`,
  tags: [],
  creatorId: `${id}-creator`,
  creatorName: `${id} creator`,
  ownerId: `${id}-owner`,
  ownerName: `${id} owner`,
  reshares: 0,
  tierKey: 'paper',
  listing: null,
  createdAt: '2026-09-09T00:00:00.000Z',
  tier: { key: 'paper', name: 'Paper', emoji: '📄', minViews: 0, color: '#fff' },
  value: 1,
})

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

async function renderAt(entry = '/binder/new', strict = false): Promise<void> {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        {strict ? <StrictMode><CreationRoutes /></StrictMode> : <CreationRoutes />}
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

function link(label: string): HTMLAnchorElement {
  const found = [...host.querySelectorAll<HTMLAnchorElement>('a')]
    .find((candidate) => candidate.textContent === label)
  if (!found) throw new Error(`Missing link: ${label}`)
  return found
}

function labelledSelect(label: string): HTMLSelectElement {
  const control = [...host.querySelectorAll<HTMLLabelElement>('label')]
    .find((candidate) => candidate.textContent?.includes(label))
    ?.querySelector<HTMLSelectElement>('select')
  if (!control) throw new Error(`Missing select: ${label}`)
  return control
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

type StartKind = 'generate-video' | 'restyle' | 'animate-edited'

async function startVideo(kind: StartKind, prompt: string): Promise<void> {
  if (kind === 'generate-video') {
    await click(button('Generate video'))
    await change(host.querySelector<HTMLTextAreaElement>('textarea[placeholder^="a capybara"]')!, prompt)
    await click(button('Render the video'))
    return
  }

  await change(labelledSelect('Output'), 'video')
  if (kind === 'restyle') await change(labelledSelect('Video remix style'), 'restyle')
  const promptControl = [...host.querySelectorAll<HTMLTextAreaElement>('textarea')]
    .find((candidate) => candidate.parentElement?.textContent?.includes('What to change') || candidate.parentElement?.textContent?.includes('Edit prompt'))!
  await change(promptControl, prompt)
  await click(button('Remix into video'))
  if (kind === 'animate-edited') await click(button('Looks good'))
}

describe('CreateMemeRoute video lifetime ownership', () => {
  for (const kind of ['generate-video', 'restyle', 'animate-edited'] as const) {
    it(`prevents a late ${kind} start from overwriting the newer route job`, async () => {
      vi.useFakeTimers()
      const starts: Array<{ prompt: string; response: ReturnType<typeof deferred<Response>> }> = []
      const statusPaths: string[] = []
      vi.stubGlobal('fetch', vi.fn<typeof fetch>((input, init) => {
        const path = pathOf(input)
        if (path === '/api/memes/remix-a') return Promise.resolve(Response.json({ meme: sourceMeme('remix-a') }))
        if (path === '/api/memes/remix-b') return Promise.resolve(Response.json({ meme: sourceMeme('remix-b') }))
        if (path === '/api/aigen/image') return Promise.resolve(Response.json({ imageUrl: '/thumb.png' }))
        if (path === '/api/aigen/image-edit') return Promise.resolve(Response.json({ imageUrl: '/edited.png' }))
        if (path === '/api/aigen/video' && init?.method === 'POST') {
          const response = deferred<Response>()
          starts.push({ prompt: String(bodyOf(init).prompt), response })
          return response.promise
        }
        if (path.startsWith('/api/aigen/video/')) {
          statusPaths.push(path)
          return Promise.resolve(Response.json({ status: 'processing' }))
        }
        throw new Error(`Unexpected request: ${path}`)
      }))
      await renderAt('/binder/new?remix=remix-a')
      await startVideo(kind, 'video A')
      expect(starts).toHaveLength(1)

      await click(link('Remix B'))
      await startVideo('generate-video', 'video B')
      expect(starts).toHaveLength(2)
      await act(async () => {
        starts[1]!.response.resolve(Response.json({ generationId: 'render-b' }))
        await settle()
      })
      expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toContain('render-b')
      expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toContain('remix-b')

      await act(async () => {
        starts[0]!.response.resolve(Response.json({ generationId: 'render-a' }))
        await settle()
      })
      expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toContain('render-b')
      expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).not.toContain('render-a')
      await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
      expect(statusPaths).toEqual(['/api/aigen/video/render-b'])
      expect(host.querySelector<HTMLInputElement>('#create-title')?.value).toBe('remix-b')
    })
  }

  it('does not start video work when a held thumbnail settles after unmount', async () => {
    const thumbnail = deferred<Response>()
    const paths: string[] = []
    vi.stubGlobal('fetch', vi.fn<typeof fetch>((input) => {
      const path = pathOf(input)
      paths.push(path)
      if (path === '/api/aigen/image') return thumbnail.promise
      throw new Error(`Unexpected request: ${path}`)
    }))
    await renderAt()
    await click(button('Generate video'))
    await change(host.querySelector<HTMLTextAreaElement>('textarea[placeholder^="a capybara"]')!, 'held thumbnail')
    await click(button('Render the video'))
    await click(link('Away'))
    await act(async () => {
      thumbnail.resolve(Response.json({ imageUrl: '/late-thumbnail.png' }))
      await settle()
    })

    expect(paths).toEqual(['/api/aigen/image'])
    expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toBeNull()
  })

  it('retains a known pending record after unmount and ignores a late in-flight completion', async () => {
    vi.useFakeTimers()
    const status = deferred<Response>()
    let statusRequests = 0
    const startedAt = Date.now()
    sessionStorage.setItem(PENDING_VIDEO_KEY, JSON.stringify({
      generationId: 'render-a', startedAt, imageUrl: '/pending-a.png', remixId: 'remix-a',
    }))
    vi.stubGlobal('fetch', vi.fn<typeof fetch>((input) => {
      const path = pathOf(input)
      if (path === '/api/memes/remix-a') return Promise.resolve(Response.json({ meme: sourceMeme('remix-a') }))
      if (path === '/api/aigen/video/render-a') {
        statusRequests += 1
        return status.promise
      }
      throw new Error(`Unexpected request: ${path}`)
    }))
    await renderAt('/binder/new?remix=remix-a')
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(statusRequests).toBe(1)
    await click(link('Away'))
    expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toContain('render-a')
    await act(async () => {
      status.resolve(Response.json({ status: 'video', videoUrl: '/late.mp4' }))
      await settle()
      await vi.advanceTimersByTimeAsync(10_000)
    })
    expect(statusRequests).toBe(1)
    expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toContain('render-a')
  })

  it('resumes and normally completes the pending job for the matching route', async () => {
    vi.useFakeTimers()
    const startedAt = Date.now()
    sessionStorage.setItem(PENDING_VIDEO_KEY, JSON.stringify({
      generationId: 'render-a', startedAt, imageUrl: '/pending-a.png', remixId: 'remix-a',
    }))
    vi.stubGlobal('fetch', vi.fn<typeof fetch>((input) => {
      const path = pathOf(input)
      if (path === '/api/memes/remix-a') return Promise.resolve(Response.json({ meme: sourceMeme('remix-a') }))
      if (path === '/api/aigen/video/render-a') {
        return Promise.resolve(Response.json({ status: 'video', videoUrl: '/finished-a.mp4' }))
      }
      throw new Error(`Unexpected request: ${path}`)
    }))
    await renderAt('/binder/new?remix=remix-a')
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); await settle() })

    expect(host.querySelector<HTMLVideoElement>('video.meme-art')?.getAttribute('src')).toBe('/finished-a.mp4')
    expect(host.querySelector('.form-grid')?.getAttribute('aria-busy')).toBe('false')
    expect(sessionStorage.getItem(PENDING_VIDEO_KEY)).toBeNull()
  })

  it('keeps the first StrictMode lifetime dead after the committed mount starts', async () => {
    const sourceLoads = [deferred<Response>(), deferred<Response>()]
    let index = 0
    vi.stubGlobal('fetch', vi.fn<typeof fetch>((input) => {
      const path = pathOf(input)
      if (path === '/api/memes/remix-a') return sourceLoads[index++]!.promise
      throw new Error(`Unexpected request: ${path}`)
    }))
    await renderAt('/binder/new?remix=remix-a', true)
    expect(index).toBe(2)
    await act(async () => {
      sourceLoads[1]!.resolve(Response.json({ meme: sourceMeme('current-source') }))
      await settle()
    })
    expect(host.textContent).toContain('current-source')
    await act(async () => {
      sourceLoads[0]!.resolve(Response.json({ meme: sourceMeme('stale-source') }))
      await settle()
    })
    expect(host.textContent).toContain('current-source')
    expect(host.textContent).not.toContain('stale-source')
  })
})
