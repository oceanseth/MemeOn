import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemeCopy } from '../../copy/createMeme'
import type { CreateMemeEvent } from '../../stores/createMemeMachine'
import { deferred } from '../../test/runtime'
import type { GiphyResult } from '../types'
import type { CreateMemeActionHost } from './actionHost'
import { onGiphySearch } from './giphyActions'
import { baseCreateMemeContext } from './testContext'

type Gate = ReturnType<typeof deferred<Response>>

function hit(id: string): GiphyResult {
  return {
    id,
    title: id,
    stillUrl: `/${id}.png`,
    gifUrl: `/${id}.gif`,
    mp4Url: null,
    author: null,
    url: `https://giphy.com/gifs/${id}`,
  }
}

function stubBrowser(): void {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
  })
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

function installFetch(): { urls: string[]; methods: string[]; gates: Gate[] } {
  const urls: string[] = []
  const methods: string[] = []
  const gates: Gate[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input, init) => {
      urls.push(requestUrl(input))
      methods.push(init?.method ?? 'GET')
      const gate = deferred<Response>()
      gates.push(gate)
      return gate.promise
    }),
  )
  return { urls, methods, gates }
}

function searchHost(): {
  host: CreateMemeActionHost & { events: CreateMemeEvent[] }
  getCtx: ReturnType<typeof vi.fn<() => typeof baseCreateMemeContext>>
} {
  const events: CreateMemeEvent[] = []
  const getCtx = vi.fn(() => baseCreateMemeContext)
  return {
    getCtx,
    host: {
      events,
      getCtx,
      send: (event) => {
        events.push(event)
      },
      beginBusy: (busy) => {
        events.push({ type: 'SUBMIT', busy })
      },
      settleBusy: (event) => {
        events.push(event)
      },
      pollVideo: () => {
        throw new Error('pollVideo should not run during giphy search')
      },
      getOwner: () => {
        throw new Error('getOwner should not run during giphy search')
      },
    },
  }
}

function startedEvents(...queries: string[]): CreateMemeEvent[] {
  const events: CreateMemeEvent[] = []
  for (const query of queries) {
    events.push({ type: 'SET_GIPHY_QUERY', query })
    events.push({ type: 'SUBMIT', busy: createMemeCopy.busy.searchingGiphy })
  }
  return events
}

function applied(results: GiphyResult[]): CreateMemeEvent[] {
  return [{ type: 'SET_GIPHY_RESULTS', results }, { type: 'DONE' }]
}

describe('onGiphySearch', () => {
  let urls: string[]
  let methods: string[]
  let gates: Gate[]
  let host: CreateMemeActionHost & { events: CreateMemeEvent[] }
  let getCtx: ReturnType<typeof searchHost>['getCtx']

  beforeEach(() => {
    stubBrowser()
    const fetchStub = installFetch()
    urls = fetchStub.urls
    methods = fetchStub.methods
    gates = fetchStub.gates
    const created = searchHost()
    host = created.host
    getCtx = created.getCtx
  })

  afterEach(() => {
    expect(getCtx).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('applies one search after its response', async () => {
    const results = [hit('cats')]
    const pending = onGiphySearch(host, 'cats')

    expect(host.events).toEqual(startedEvents('cats'))
    expect(urls).toEqual(['/api/giphy/search?q=cats'])
    expect(methods).toEqual(['GET'])

    gates[0]?.resolve(Response.json({ results }))
    await pending

    expect(host.events).toEqual([...startedEvents('cats'), ...applied(results)])
    expect(host.events.some((event) => event.type === 'FAIL')).toBe(false)
  })

  it('drops an older success when a newer search is in flight', async () => {
    const oldResults = [hit('old')]
    const newResults = [hit('new')]
    const cats = onGiphySearch(host, 'cats')
    const dogs = onGiphySearch(host, 'dogs')

    expect(urls).toEqual(['/api/giphy/search?q=cats', '/api/giphy/search?q=dogs'])
    expect(methods).toEqual(['GET', 'GET'])

    gates[0]?.resolve(Response.json({ results: oldResults }))
    await cats

    expect(host.events).toEqual(startedEvents('cats', 'dogs'))

    gates[1]?.resolve(Response.json({ results: newResults }))
    await dogs

    expect(host.events).toEqual([...startedEvents('cats', 'dogs'), ...applied(newResults)])
  })

  it('drops a stale body when both searches use the same query', async () => {
    const oldResults = [hit('old')]
    const newResults = [hit('new')]
    const first = onGiphySearch(host, 'cats')
    const second = onGiphySearch(host, 'cats')

    expect(urls).toEqual(['/api/giphy/search?q=cats', '/api/giphy/search?q=cats'])

    gates[1]?.resolve(Response.json({ results: newResults }))
    await second

    expect(host.events).toEqual([...startedEvents('cats', 'cats'), ...applied(newResults)])
    const appliedEvents = [...host.events]

    gates[0]?.resolve(Response.json({ results: oldResults }))
    await first

    expect(host.events).toEqual(appliedEvents)
  })

  it('does not settle busy when an older search rejects', async () => {
    const newResults = [hit('new')]
    const first = onGiphySearch(host, 'cats')
    const second = onGiphySearch(host, 'dogs')

    gates[0]?.reject(new Error('stale'))
    await first

    expect(host.events).toEqual(startedEvents('cats', 'dogs'))

    gates[1]?.resolve(Response.json({ results: newResults }))
    await second

    expect(host.events).toEqual([...startedEvents('cats', 'dogs'), ...applied(newResults)])
  })

  it('does not let an older success clear a newer failure', async () => {
    const cats = onGiphySearch(host, 'cats')
    const dogs = onGiphySearch(host, 'dogs')
    const failed: CreateMemeEvent[] = [
      ...startedEvents('cats', 'dogs'),
      { type: 'FAIL', err: createMemeCopy.errors.giphySearchFailed },
    ]

    gates[1]?.reject(new Error('offline'))
    await dogs

    expect(host.events).toEqual(failed)

    gates[0]?.resolve(Response.json({ results: [hit('old')] }))
    await cats

    expect(host.events).toEqual(failed)
  })

  it('does not fetch, busy, or retire an in-flight search for an empty query', async () => {
    await onGiphySearch(host, '')
    await onGiphySearch(host, ' \n\t ')

    expect(urls).toEqual([])
    expect(host.events).toEqual([])
    expect(getCtx).not.toHaveBeenCalled()

    const results = [hit('cats')]
    const cats = onGiphySearch(host, 'cats')
    await Promise.resolve()
    expect(urls).toEqual(['/api/giphy/search?q=cats'])

    await onGiphySearch(host, '')
    await onGiphySearch(host, '   ')

    expect(urls).toEqual(['/api/giphy/search?q=cats'])
    expect(host.events).toEqual(startedEvents('cats'))

    gates[0]?.resolve(Response.json({ results }))
    await cats

    expect(host.events).toEqual([...startedEvents('cats'), ...applied(results)])
  })
})
