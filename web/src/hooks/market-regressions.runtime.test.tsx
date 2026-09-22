import { act } from 'react'
import type { Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listedHolo, meLou, memeplexEmpty, paperMeme, silverMeme } from '../../.storybook/fixtures'
import { marketplaceCopy } from '../copy/marketplace'
import { memeDetailCopy } from '../copy/memeDetail'
import { memeplexPanelCopy } from '../copy/memeplexPanel'
import { MARKETPLACE_SEARCH_DEBOUNCE_MS } from '../lib/marketplaceQuery'
import type { Meme } from '../lib/types'
import type { AppStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { button as queryButton, change, click } from '../test/dom'
import { deferred, settle, stubClipboardWrite } from '../test/runtime'
import { mountSignedInRoot, unmountSignedInRoot } from '../test/signedInHost'
import { MemeDetailView } from '../views/MemeDetailView'
import { MarketplaceView } from '../views/MarketplaceView'

vi.mock('../lib/firebase', () => ({
  firebaseSignOut: vi.fn(),
  firebaseSignIn: vi.fn(async () => {}),
}))

function requestDetails(input: RequestInfo | URL, init?: RequestInit) {
  const value = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const url = new URL(value, window.location.origin)
  return { url, method: init?.method ?? 'GET' }
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
      [
        {
          isIntersecting: true,
          target: this.observed,
        } as IntersectionObserverEntry,
      ],
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
  return queryButton(label, root)
}

/** Each card names itself through `aria-labelledby`, so the list reads as its accessible names. */
function cardTitles(): string[] {
  return [...host.querySelectorAll<HTMLElement>('article[aria-labelledby]')].map(
    (card) =>
      document.getElementById(card.getAttribute('aria-labelledby') ?? '')?.textContent ?? '',
  )
}

function sentinel(): HTMLElement | null {
  return host.querySelector('[data-slot="load-more"]')
}

let host: HTMLDivElement
let root: Root
let stores: AppStores

beforeEach(async () => {
  const mounted = await mountSignedInRoot()
  host = mounted.host
  root = mounted.root
  stores = mounted.stores
})

afterEach(async () => {
  await unmountSignedInRoot({ host, root, stores })
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
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((input, init) => {
        const { url, method } = requestDetails(input, init)
        if (method === 'GET' && url.pathname === '/api/memes/detail-delete') {
          detailReads += 1
          if (detailReads === 1) {
            return Promise.resolve(
              Response.json({
                meme: ownerMeme,
                positions: [{ userId: meLou.sub, shares: 100 }],
              }),
            )
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
      }),
    )

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

    await click(button(memeDetailCopy.actions.makePublic))
    await eventually(() => expect(detailReads).toBe(2))
    await click(button(memeDetailCopy.actions.delete))
    // the confirmations are Base UI popups: mounted means open, so presence is the whole state
    let dialog = host.querySelector('[role="alertdialog"]')!
    await click(button(memeDetailCopy.deleteDialog.confirm, dialog))
    expect(deleteRequests).toBe(1)

    await act(async () => {
      refreshedDetail.resolve(
        Response.json({
          meme: ownerMeme,
          positions: [{ userId: meLou.sub, shares: 100 }],
        }),
      )
      await settle()
      firstDelete.resolve(Response.json({ error: 'delete conflicted' }, { status: 409 }))
      await settle()
    })

    await eventually(() =>
      expect(host.querySelector('[data-slot="alert"]')?.textContent).toContain('delete conflicted'),
    )
    expect(host.querySelector('[role="alertdialog"]')).toBeNull()
    // the failure ends the request: nothing on the page is still presented as in flight
    expect(host.querySelector('[aria-busy="true"]')).toBeNull()
    expect(button(memeDetailCopy.actions.delete).disabled).toBe(false)

    await click(button(memeDetailCopy.actions.delete))
    dialog = host.querySelector('[role="alertdialog"]')!
    await click(button(memeDetailCopy.deleteDialog.confirm, dialog))
    await eventually(() =>
      expect(host.querySelector('output[aria-label="Current route"]')?.textContent).toBe('/binder'),
    )
    expect(deleteRequests).toBe(2)
    expect(host.textContent).toContain('Binder destination')
  })
})

interface MarketPage {
  memes: Meme[]
  nextCursor: string | null
  status?: number
}

function marketFetch(
  pages: Record<string, MarketPage>,
  fallback?: (cursor: string) => Promise<Response>,
) {
  const requests: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input, init) => {
      const { url, method } = requestDetails(input, init)
      if (method !== 'GET' || url.pathname !== '/api/memes') {
        throw new Error(`Unexpected request: ${method} ${url.pathname}`)
      }
      const cursor = url.searchParams.get('cursor') ?? 'initial'
      requests.push(cursor)
      const page = pages[cursor]
      if (page) {
        return Promise.resolve(
          Response.json(
            page.status
              ? { error: 'page unavailable' }
              : { memes: page.memes, nextCursor: page.nextCursor },
            { status: page.status ?? 200 },
          ),
        )
      }
      if (fallback) return fallback(cursor)
      throw new Error(`Unexpected cursor: ${cursor}`)
    }),
  )
  return requests
}

function holdCatalog() {
  const requests: string[] = []
  const gates: Array<ReturnType<typeof deferred<Response>>> = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input, init) => {
      const { url, method } = requestDetails(input, init)
      if (method !== 'GET' || url.pathname !== '/api/memes') {
        throw new Error(`Unexpected request: ${method} ${url.pathname}`)
      }
      requests.push(url.searchParams.toString())
      const gate = deferred<Response>()
      gates.push(gate)
      return gate.promise
    }),
  )
  return { requests, gates }
}

/** `status` 503 matches `marketFetch`: the body is the error, not a page. */
function catalogPage(memes: Meme[], nextCursor: string | null, status?: number): Response {
  return Response.json(status ? { error: 'page unavailable' } : { memes, nextCursor }, {
    status: status ?? 200,
  })
}

function searchInput(): HTMLInputElement {
  const input = host.querySelector<HTMLInputElement>(
    `input[aria-label="${marketplaceCopy.search.label}"]`,
  )
  if (!input) throw new Error('Missing marketplace search')
  return input
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

type HeldGate = ReturnType<typeof deferred<Response>>

/**
 * A newer search is already in flight. `afterStale` runs after the retired response is released.
 * `newer-search` retires the first refresh (LOADED or FAIL). `retired-page` retires the next page
 * (APPEND or MORE_FAILED) that a visible cursor started.
 */
async function dropStaleCatalogResponse(spec: {
  kind: 'newer-search' | 'retired-page'
  stale: Response
  afterStale: (requests: string[]) => void
}): Promise<void> {
  const release = async (gate: HeldGate | undefined, response: Response) => {
    await act(async () => {
      gate?.resolve(response)
      await settle()
    })
  }

  installVisibleObserver()
  const { requests, gates } = holdCatalog()
  await renderMarketplace()
  await macrotask(MARKETPLACE_SEARCH_DEBOUNCE_MS)
  await eventually(() => expect(requests).toHaveLength(1))

  if (spec.kind === 'newer-search') {
    expect(requests[0]).not.toContain('q=')
    await change(searchInput(), 'silver')
    await macrotask(MARKETPLACE_SEARCH_DEBOUNCE_MS)
    await eventually(() => {
      expect(requests).toHaveLength(2)
      expect(requests[1]).toContain('q=silver')
    })
    expect(requests[0]).not.toContain('q=')

    await release(gates[1], catalogPage([silverMeme], null))
    await eventually(() => expect(cardTitles()).toEqual([silverMeme.title]))
    await release(gates[0], spec.stale)
    await macrotask(30)
    expect(cardTitles()).toEqual([silverMeme.title])
    spec.afterStale(requests)
    return
  }

  await release(gates[0], catalogPage([paperMeme], 'cursor-a'))
  await eventually(() => {
    expect(cardTitles()).toEqual([paperMeme.title])
    expect(requests.some((query) => query.includes('cursor=cursor-a'))).toBe(true)
  })

  await change(searchInput(), 'holo')
  await macrotask(MARKETPLACE_SEARCH_DEBOUNCE_MS)
  await eventually(() => {
    expect(requests).toHaveLength(3)
    expect(requests[2]).toContain('q=holo')
    expect(requests[2]).not.toContain('cursor')
  })

  await release(gates[1], spec.stale)
  spec.afterStale(requests)

  const active = AsyncVisibleObserver.instances.find((observer) => !observer.disconnected)
  if (!active) throw new Error('Missing connected observer')
  await act(async () => {
    active.notify()
    await settle()
  })
  await macrotask(30)
  expect(requests).toHaveLength(3)

  await release(gates[2], catalogPage([listedHolo], null))
  await eventually(() => expect(cardTitles()).toEqual([listedHolo.title]))
  expect(host.textContent).not.toContain(marketplaceCopy.loadMoreError)
  expect(requests).toHaveLength(3)
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
      'cursor-a': {
        memes: [{ ...paperMeme, title: 'duplicate paper' }],
        nextCursor: 'cursor-b',
      },
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
      expect(host.textContent).toContain(marketplaceCopy.loadMoreError)
    })
    // the cursor survives the failure, and the observer stops auto-firing until it is retried
    await macrotask(30)
    expect(requests).toEqual(['initial', 'cursor-a'])
    expect(sentinel()).not.toBeNull()
    expect(button(marketplaceCopy.loadMoreRetry).disabled).toBe(false)
  })

  it('guards a pending continuation from duplicate callbacks and disconnects on unmount', async () => {
    installVisibleObserver()
    const continuation = deferred<Response>()
    const requests = marketFetch(
      { initial: { memes: [paperMeme], nextCursor: 'cursor-a' } },
      () => continuation.promise,
    )
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

  it('drops a stale catalogue load after a newer search has landed', async () => {
    await dropStaleCatalogResponse({
      kind: 'newer-search',
      stale: catalogPage([paperMeme], 'cursor-stale'),
      afterStale: (requests) => {
        expect(cardTitles()).not.toContain(paperMeme.title)
        expect(requests).toHaveLength(2)
        expect(host.textContent).not.toContain(marketplaceCopy.errorHeading)
      },
    })
  })

  it('drops a stale catalogue failure after a newer search has landed', async () => {
    await dropStaleCatalogResponse({
      kind: 'newer-search',
      stale: catalogPage([], null, 503),
      afterStale: () => {
        expect(host.textContent).not.toContain(marketplaceCopy.errorHeading)
        expect(host.textContent).not.toContain(marketplaceCopy.loadError)
      },
    })
  })

  it('drops a stale append so it cannot mix cards or unlock another page', async () => {
    await dropStaleCatalogResponse({
      kind: 'retired-page',
      stale: catalogPage([silverMeme], 'cursor-b'),
      afterStale: () => {
        expect(cardTitles()).toEqual([paperMeme.title])
        expect(cardTitles()).not.toContain(silverMeme.title)
      },
    })
  })

  it('drops a stale paging failure without showing the next-page error', async () => {
    await dropStaleCatalogResponse({
      kind: 'retired-page',
      stale: catalogPage([], null, 503),
      afterStale: () => {
        expect(host.textContent).not.toContain(marketplaceCopy.loadMoreError)
      },
    })
  })
})

function jsonError(): Response {
  return Response.json({ error: 'unavailable' }, { status: 503 })
}

function installDetailApi(options: {
  meme: Meme
  positions?: { userId: string; shares: number }[]
  stats?: 'ok' | 'fail'
  plex?: 'ok' | 'fail'
  binder?: 'ok' | 'fail'
  holders?: 'ok' | 'fail'
}) {
  const id = options.meme.id
  const positions = options.positions ?? [{ userId: meLou.sub, shares: 100 }]
  const requests: Array<{ method: string; path: string }> = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input, init) => {
      const { url, method } = requestDetails(input, init)
      const path = url.pathname
      requests.push({ method, path })
      if (method === 'GET' && path === `/api/memes/${id}`) {
        return Promise.resolve(Response.json({ meme: options.meme, positions }))
      }
      if (method === 'GET' && path === `/api/memes/${id}/stats`) {
        return options.stats === 'fail'
          ? Promise.resolve(jsonError())
          : Promise.resolve(Response.json({ views: 0, reshares: 0, sources: [] }))
      }
      if (method === 'GET' && path === `/api/memes/${id}/memeplex`) {
        return options.plex === 'fail'
          ? Promise.resolve(jsonError())
          : Promise.resolve(Response.json(memeplexEmpty))
      }
      if (method === 'GET' && path === '/api/binder') {
        return options.binder === 'fail'
          ? Promise.resolve(jsonError())
          : Promise.resolve(Response.json({ memes: [] }))
      }
      if (method === 'GET' && path === '/api/users') {
        return options.holders === 'fail'
          ? Promise.resolve(jsonError())
          : Promise.resolve(Response.json({ users: [] }))
      }
      if (method === 'POST' && path === `/api/memes/${id}/memeplex`) {
        return Promise.resolve(Response.json({ ok: true }))
      }
      throw new Error(`Unexpected request: ${method} ${path}`)
    }),
  )
  return requests
}

async function renderDetail(id: string): Promise<void> {
  await act(async () => {
    root.render(
      <StoresProvider stores={stores}>
        <MemoryRouter initialEntries={[`/m/${id}`]}>
          <Routes>
            <Route path="/m/:id" element={<MemeDetailView />} />
          </Routes>
        </MemoryRouter>
      </StoresProvider>,
    )
    await settle()
  })
}

describe('MemeDetailView secondary failures', () => {
  const ownerMeme: Meme = {
    ...paperMeme,
    id: 'detail-swallows',
    title: 'swallow owner meme',
    creatorId: meLou.sub,
    creatorName: meLou.name,
    ownerId: meLou.sub,
    ownerName: meLou.name,
  }

  it('keeps the page ready when stats fail and hides the spreading card', async () => {
    installDetailApi({ meme: ownerMeme, stats: 'fail' })
    await renderDetail(ownerMeme.id)
    await eventually(() => expect(host.textContent).toContain(ownerMeme.title))
    expect(host.textContent).not.toContain(memeDetailCopy.spreading.title)
    expect(host.querySelector('[data-slot="alert"]')).toBeNull()
  })

  it('keeps paste-a-link working when the plex binder picker fails', async () => {
    const requests = installDetailApi({ meme: ownerMeme, binder: 'fail' })
    await renderDetail(ownerMeme.id)
    await eventually(() => expect(host.textContent).toContain(ownerMeme.title))
    const pasted = host.querySelector<HTMLInputElement>(
      `input[aria-label="${memeplexPanelCopy.pasted}"]`,
    )
    expect(pasted).not.toBeNull()
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
        pasted,
        silverMeme.id,
      )
      pasted!.dispatchEvent(new Event('input', { bubbles: true }))
      await settle()
    })
    const linkButton = [...host.querySelectorAll('button')].find(
      (candidate) => candidate.textContent?.trim() === memeplexPanelCopy.link,
    )
    if (!linkButton) throw new Error('Missing memeplex Link button')
    await click(linkButton)
    await eventually(() =>
      expect(
        requests.some(
          (request) =>
            request.method === 'POST' && request.path === `/api/memes/${ownerMeme.id}/memeplex`,
        ),
      ).toBe(true),
    )
  })

  it('falls back to holder.unknown when holder names fail', async () => {
    installDetailApi({
      meme: ownerMeme,
      holders: 'fail',
      positions: [
        { userId: meLou.sub, shares: 60 },
        { userId: 'user-pal', shares: 40 },
      ],
    })
    await renderDetail(ownerMeme.id)
    await eventually(() => expect(host.textContent).toContain(ownerMeme.title))
    await eventually(() => expect(host.textContent).toContain(memeDetailCopy.holder.unknown))
    expect(host.textContent).toContain(memeDetailCopy.holder.you)
  })

  it('shows share.copyFailed when clipboard write rejects', async () => {
    installDetailApi({ meme: ownerMeme })
    stubClipboardWrite(async () => {
      throw new Error('denied')
    })
    await renderDetail(ownerMeme.id)
    await eventually(() => expect(host.textContent).toContain(ownerMeme.title))
    await click(button(memeDetailCopy.share.copy))
    await eventually(() => expect(button(memeDetailCopy.share.copyFailed)).toBeTruthy())
  })

  it('copies the share link and shows share.copied', async () => {
    installDetailApi({ meme: ownerMeme })
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboardWrite(writeText)
    await renderDetail(ownerMeme.id)
    await eventually(() => expect(host.textContent).toContain(ownerMeme.title))
    await click(button(memeDetailCopy.share.copy))
    await eventually(() => expect(button(memeDetailCopy.share.copied)).toBeTruthy())
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/m/${ownerMeme.id}`)
  })

  it('surfaces memeplex.loadFailed without FAILing the page', async () => {
    installDetailApi({ meme: ownerMeme, plex: 'fail' })
    await renderDetail(ownerMeme.id)
    await eventually(() => expect(host.textContent).toContain(ownerMeme.title))
    await eventually(() =>
      expect(host.querySelector('[data-slot="alert"]')?.textContent).toContain(
        memeDetailCopy.memeplex.loadFailed,
      ),
    )
    expect(host.textContent).not.toContain(memeplexPanelCopy.empty)
  })
})
