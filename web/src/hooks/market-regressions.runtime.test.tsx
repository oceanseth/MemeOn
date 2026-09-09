import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { createActor, fromPromise } from 'xstate'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listedHolo, meLou, memeplexEmpty, paperMeme, silverMeme } from '../../.storybook/fixtures'
import type { Me, Meme } from '../lib/types'
import { authMachine } from '../stores/authMachine'
import { createStores, type AppStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { MemeDetailView } from '../views/MemeDetailView'
import { MarketplaceView } from '../views/MarketplaceView'

vi.mock('../lib/firebase', () => ({
  firebaseSignOut: vi.fn(),
  firebaseSignIn: vi.fn(async () => {}),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

function requestDetails(input: RequestInfo | URL, init?: RequestInit) {
  const value = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url
  const url = new URL(value, window.location.origin)
  return { url, method: init?.method ?? 'GET' }
}

async function settle(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

async function macrotask(delay = 0): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, delay))
    await settle()
  })
}

async function eventually(assertion: () => void, timeout = 1200): Promise<void> {
  const deadline = performance.now() + timeout
  let failure: unknown
  while (performance.now() < deadline) {
    try {
      assertion()
      return
    } catch (error) {
      failure = error
      await macrotask(10)
    }
  }
  throw failure
}

function CurrentRoute() {
  return <output aria-label="Current route">{useLocation().pathname}</output>
}

class AsyncVisibleObserver implements IntersectionObserver {
  static instances: AsyncVisibleObserver[] = []
  readonly root = null
  readonly rootMargin: string
  readonly thresholds = [0]
  disconnected = false
  observed: Element | null = null

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.rootMargin = options.rootMargin ?? '0px'
    AsyncVisibleObserver.instances.push(this)
  }

  observe(target: Element): void {
    this.observed = target
    setTimeout(() => this.notify(), 0)
  }

  notify(): void {
    if (this.disconnected || !this.observed?.isConnected) return
    this.callback(
      [{ isIntersecting: true, target: this.observed } as IntersectionObserverEntry],
      this,
    )
  }

  disconnect(): void {
    this.disconnected = true
    this.observed = null
  }

  unobserve(target: Element): void {
    if (this.observed === target) this.observed = null
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

function installVisibleObserver(): void {
  AsyncVisibleObserver.instances = []
  vi.stubGlobal('IntersectionObserver', AsyncVisibleObserver)
}

function button(label: string, root: ParentNode = host): HTMLButtonElement {
  const found = [...root.querySelectorAll<HTMLButtonElement>('button')]
    .find((candidate) => candidate.textContent?.includes(label))
  if (!found) throw new Error(`Missing button: ${label}`)
  return found
}

async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click()
    await settle()
  })
}

function cardTitles(): string[] {
  return [...host.querySelectorAll<HTMLElement>('.meme-title')]
    .map((element) => element.textContent ?? '')
}

function sentinel(): HTMLElement | null {
  return host.querySelector('.card-grid + div')
}

let host: HTMLDivElement
let root: Root
let stores: AppStores

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  const authActor = createActor(authMachine.provide({
    actors: { loadMe: fromPromise(async (): Promise<Me | null> => meLou) },
    actions: { clearSessionAndFirebase: () => {} },
  }))
  stores = createStores(authActor)
  stores.retain()
  await stores.auth.refresh()
})

afterEach(async () => {
  await act(() => root.unmount())
  stores.auth.logout()
  stores.dispose()
  await Promise.resolve()
  host.remove()
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('MemeDetailView mutation overlap', () => {
  it('settles a failed deletion after a visibility reload and permits a successful retry', async () => {
    const refreshedDetail = deferred<Response>()
    const firstDelete = deferred<Response>()
    const ownerMeme: Meme = {
      ...listedHolo,
      id: 'detail-delete',
      title: 'private owner meme',
      creatorId: meLou.sub,
      creatorName: meLou.name,
      ownerId: meLou.sub,
      ownerName: meLou.name,
      listing: null,
      private: true,
    }
    let detailReads = 0
    let deleteRequests = 0
    vi.stubGlobal('fetch', vi.fn<typeof fetch>((input, init) => {
      const { url, method } = requestDetails(input, init)
      if (method === 'GET' && url.pathname === '/api/memes/detail-delete') {
        detailReads += 1
        if (detailReads === 1) {
          return Promise.resolve(Response.json({
            meme: ownerMeme,
            positions: [{ userId: meLou.sub, shares: 100 }],
          }))
        }
        if (detailReads === 2) return refreshedDetail.promise
      }
      if (method === 'GET' && url.pathname === '/api/memes/detail-delete/stats') {
        return Promise.resolve(Response.json({ views: 0, reshares: 0, sources: [] }))
      }
      if (method === 'GET' && url.pathname === '/api/memes/detail-delete/memeplex') {
        return Promise.resolve(Response.json(memeplexEmpty))
      }
      if (method === 'GET' && url.pathname === '/api/binder') {
        return Promise.resolve(Response.json({ memes: [] }))
      }
      if (method === 'POST' && url.pathname === '/api/memes/detail-delete/visibility') {
        return Promise.resolve(Response.json({ ok: true }))
      }
      if (method === 'DELETE' && url.pathname === '/api/memes/detail-delete') {
        deleteRequests += 1
        return deleteRequests === 1
          ? firstDelete.promise
          : Promise.resolve(Response.json({ ok: true }))
      }
      throw new Error(`Unexpected request: ${method} ${url.pathname}`)
    }))

    await act(async () => {
      root.render(
        <StoresProvider stores={stores}>
          <MemoryRouter initialEntries={['/m/detail-delete']}>
            <Routes>
              <Route path="/m/:id" element={<MemeDetailView />} />
              <Route path="/binder" element={<p>Binder destination</p>} />
            </Routes>
            <CurrentRoute />
          </MemoryRouter>
        </StoresProvider>,
      )
      await settle()
    })
    await eventually(() => expect(host.textContent).toContain(ownerMeme.title))

    await click(button('Make public'))
    await eventually(() => expect(detailReads).toBe(2))
    await click(button('Delete forever'))
    // the confirmations are native <dialog>s: they stay mounted and open/close in the top layer
    let dialog = host.querySelector('dialog[open][role="alertdialog"]')!
    await click(button('Delete it forever', dialog))
    expect(deleteRequests).toBe(1)

    await act(async () => {
      refreshedDetail.resolve(Response.json({
        meme: ownerMeme,
        positions: [{ userId: meLou.sub, shares: 100 }],
      }))
      await settle()
      firstDelete.resolve(Response.json({ error: 'delete conflicted' }, { status: 409 }))
      await settle()
    })

    await eventually(() => expect(host.querySelector('.notice.error')?.textContent).toContain('delete conflicted'))
    expect(host.querySelector('dialog[open][role="alertdialog"]')).toBeNull()
    expect(host.querySelector('.pack-overlay')).toBeNull()
    expect(button('Delete forever').disabled).toBe(false)

    await click(button('Delete forever'))
    dialog = host.querySelector('dialog[open][role="alertdialog"]')!
    await click(button('Delete it forever', dialog))
    await eventually(() => expect(host.querySelector('output[aria-label="Current route"]')?.textContent).toBe('/binder'))
    expect(deleteRequests).toBe(2)
    expect(host.textContent).toContain('Binder destination')
  })
})

interface MarketPage {
  memes: Meme[]
  nextCursor: string | null
  status?: number
}

function marketFetch(pages: Record<string, MarketPage>) {
  const requests: string[] = []
  vi.stubGlobal('fetch', vi.fn<typeof fetch>((input, init) => {
    const { url, method } = requestDetails(input, init)
    if (method !== 'GET' || url.pathname !== '/api/memes') {
      throw new Error(`Unexpected request: ${method} ${url.pathname}`)
    }
    const cursor = url.searchParams.get('cursor') ?? 'initial'
    requests.push(cursor)
    const page = pages[cursor]
    if (!page) throw new Error(`Unexpected cursor: ${cursor}`)
    return Promise.resolve(Response.json(
      page.status ? { error: 'page unavailable' } : { memes: page.memes, nextCursor: page.nextCursor },
      { status: page.status ?? 200 },
    ))
  }))
  return requests
}

async function renderMarketplace(): Promise<void> {
  await act(async () => {
    root.render(
      <StoresProvider stores={stores}>
        <MemoryRouter initialEntries={['/marketplace']}>
          <MarketplaceView />
        </MemoryRouter>
      </StoresProvider>,
    )
    await settle()
  })
}

describe('MarketplaceView continuously visible pagination', () => {
  it('automatically crosses an empty sparse page and stops after the final cursor', async () => {
    installVisibleObserver()
    const requests = marketFetch({
      initial: { memes: [paperMeme], nextCursor: 'cursor-a' },
      'cursor-a': { memes: [], nextCursor: 'cursor-b' },
      'cursor-b': { memes: [silverMeme], nextCursor: null },
    })
    await renderMarketplace()

    await eventually(() => expect(cardTitles()).toEqual([paperMeme.title, silverMeme.title]))
    expect(requests).toEqual(['initial', 'cursor-a', 'cursor-b'])
    expect(sentinel()).toBeNull()
    await macrotask(30)
    expect(requests).toEqual(['initial', 'cursor-a', 'cursor-b'])
  })

  it('automatically crosses a duplicate-only page without rendering the duplicate', async () => {
    installVisibleObserver()
    const requests = marketFetch({
      initial: { memes: [paperMeme], nextCursor: 'cursor-a' },
      'cursor-a': { memes: [{ ...paperMeme, title: 'duplicate paper' }], nextCursor: 'cursor-b' },
      'cursor-b': { memes: [silverMeme], nextCursor: null },
    })
    await renderMarketplace()

    await eventually(() => expect(cardTitles()).toEqual([paperMeme.title, silverMeme.title]))
    expect(requests).toEqual(['initial', 'cursor-a', 'cursor-b'])
    expect(host.textContent).not.toContain('duplicate paper')
    expect(sentinel()).toBeNull()
  })

  it('keeps existing cards and offers a retry after a paging failure', async () => {
    installVisibleObserver()
    const requests = marketFetch({
      initial: { memes: [paperMeme], nextCursor: 'cursor-a' },
      'cursor-a': { memes: [], nextCursor: null, status: 503 },
    })
    await renderMarketplace()

    await eventually(() => {
      expect(requests).toEqual(['initial', 'cursor-a'])
      expect(cardTitles()).toEqual([paperMeme.title])
      expect(host.textContent).toContain("Couldn't pull the next page.")
    })
    // the cursor survives the failure, and the observer stops auto-firing until it is retried
    await macrotask(30)
    expect(requests).toEqual(['initial', 'cursor-a'])
    expect(sentinel()).not.toBeNull()
    expect(button('Try again').disabled).toBe(false)
  })

  it('guards a pending continuation from duplicate callbacks and disconnects on unmount', async () => {
    installVisibleObserver()
    const continuation = deferred<Response>()
    const requests: string[] = []
    vi.stubGlobal('fetch', vi.fn<typeof fetch>((input, init) => {
      const { url, method } = requestDetails(input, init)
      if (method !== 'GET' || url.pathname !== '/api/memes') {
        throw new Error(`Unexpected request: ${method} ${url.pathname}`)
      }
      const cursor = url.searchParams.get('cursor') ?? 'initial'
      requests.push(cursor)
      return cursor === 'initial'
        ? Promise.resolve(Response.json({ memes: [paperMeme], nextCursor: 'cursor-a' }))
        : continuation.promise
    }))
    await renderMarketplace()
    await eventually(() => expect(requests).toEqual(['initial', 'cursor-a']))

    const active = AsyncVisibleObserver.instances.find((observer) => !observer.disconnected)!
    await act(async () => {
      active.notify()
      active.notify()
      await settle()
    })
    expect(requests).toEqual(['initial', 'cursor-a'])

    await act(() => root.unmount())
    expect(AsyncVisibleObserver.instances.every((observer) => observer.disconnected)).toBe(true)
    await act(async () => {
      continuation.resolve(Response.json({ memes: [silverMeme], nextCursor: null }))
      await settle()
    })
    expect(host.textContent).toBe('')
    expect(requests).toEqual(['initial', 'cursor-a'])
  })
})
