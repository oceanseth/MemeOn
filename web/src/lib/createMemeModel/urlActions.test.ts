import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemeCopy } from '../../copy/createMeme'
import type { CreateMemeEvent } from '../../stores/createMemeMachine'
import { deferred, jsonResponse, stubLocalStorage } from '../../test/runtime'
import type { CreateMemeActionHost } from './actionHost'
import { baseCreateMemeContext } from './testContext'
import { onResolvePageUrl } from './urlActions'

type Gate = ReturnType<typeof deferred<Response>>

const page = {
  imageUrl: 'https://cdn.example/found.png',
  videoUrl: null as string | null,
  source: { provider: 'page', id: 'p1', url: 'https://example.com/post', author: null },
}

function resolving(): CreateMemeEvent {
  return { type: 'SUBMIT', busy: createMemeCopy.busy.resolvingPage }
}

function urlHost(urlDraft: string, busy: string | null = null) {
  const ctx = { ...baseCreateMemeContext, mode: 'url' as const, urlDraft, busy }
  const events: CreateMemeEvent[] = []
  const host: CreateMemeActionHost = {
    getCtx: () => ctx,
    send: (event) => events.push(event),
    beginBusy: (label) => {
      ctx.busy = label
      events.push({ type: 'SUBMIT', busy: label })
    },
    settleBusy: (event) => {
      ctx.busy = null
      ctx.busyElapsed = null
      events.push(event)
    },
    pollVideo: () => Promise.reject(new Error('unused')),
    getOwner: () => null,
  }
  return { ctx, events, host }
}

function recordPosts() {
  const calls: { path: string; method: string; body: unknown }[] = []
  const gates: Gate[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input, init) => {
      calls.push({
        path: String(input),
        method: init?.method ?? 'GET',
        body: init?.body ? (JSON.parse(String(init.body)) as unknown) : null,
      })
      const gate = deferred<Response>()
      gates.push(gate)
      return gate.promise
    }),
  )
  return { calls, gates }
}

describe('onResolvePageUrl', () => {
  beforeEach(() => {
    stubLocalStorage()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('unexpected fetch'))),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts one trimmed page url, then posts again after done', async () => {
    const { calls, gates } = recordPosts()
    const { ctx, events, host } = urlHost('  https://example.com/post  ')
    const pending = onResolvePageUrl(host)

    expect(events).toEqual([resolving()])
    expect(calls).toEqual([
      { path: '/api/resolve-image', method: 'POST', body: { url: 'https://example.com/post' } },
    ])
    expect(ctx.busy).toBe(createMemeCopy.busy.resolvingPage)

    const gate = gates[0]
    if (!gate) throw new Error('missing resolve gate')
    gate.resolve(jsonResponse(page))
    await pending

    expect(events).toEqual([
      resolving(),
      {
        type: 'SET_RESOLVED',
        imageUrl: page.imageUrl,
        videoUrl: page.videoUrl,
        source: page.source,
      },
      { type: 'DONE' },
    ])
    expect(ctx.busy).toBeNull()

    ctx.urlDraft = 'https://example.com/other'
    const again = onResolvePageUrl(host)
    expect(calls[1]).toEqual({
      path: '/api/resolve-image',
      method: 'POST',
      body: { url: 'https://example.com/other' },
    })
    const next = gates[1]
    if (!next) throw new Error('missing second resolve gate')
    next.resolve(jsonResponse({ ...page, imageUrl: 'https://cdn.example/other.png' }))
    await again
    expect(ctx.busy).toBeNull()
    expect(calls).toHaveLength(2)
  })

  it('drops a second call while the first post is still in flight', async () => {
    const { calls, gates } = recordPosts()
    const { events, host } = urlHost('https://example.com/post')
    const first = onResolvePageUrl(host)
    const second = onResolvePageUrl(host)

    await expect(second).resolves.toBeUndefined()
    expect(calls).toHaveLength(1)
    expect(events).toEqual([resolving()])

    const gate = gates[0]
    if (!gate) throw new Error('missing resolve gate')
    gate.resolve(jsonResponse(page))
    await first

    expect(events).toEqual([
      resolving(),
      {
        type: 'SET_RESOLVED',
        imageUrl: page.imageUrl,
        videoUrl: page.videoUrl,
        source: page.source,
      },
      { type: 'DONE' },
    ])
  })

  it('drops a page, an image, and a non-link while minting', async () => {
    const { ctx, events, host } = urlHost('https://example.com/post', createMemeCopy.busy.minting)
    await onResolvePageUrl(host)
    ctx.urlDraft = 'https://cdn.example/a.png'
    await onResolvePageUrl(host)
    ctx.urlDraft = 'notaurl'
    await onResolvePageUrl(host)

    expect(events).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
    expect(ctx.busy).toBe(createMemeCopy.busy.minting)
  })

  it('short-circuits png and jpeg urls without posting', async () => {
    for (const url of ['https://cdn.example/a.png', 'https://cdn.example/a.jpeg?x=1']) {
      const { ctx, events, host } = urlHost(url)
      await onResolvePageUrl(host)
      expect(events).toEqual([
        { type: 'SET_RESOLVED', imageUrl: url, videoUrl: null, source: null },
      ])
      expect(ctx.busy).toBeNull()
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does nothing for an empty or whitespace draft', async () => {
    for (const urlDraft of ['', '   ']) {
      const { events, host } = urlHost(urlDraft)
      await onResolvePageUrl(host)
      expect(events).toEqual([])
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fails a non-http draft without posting', async () => {
    const { ctx, events, host } = urlHost('example.com')
    await onResolvePageUrl(host)
    expect(events).toEqual([{ type: 'FAIL', err: createMemeCopy.errors.notALink }])
    expect(fetch).not.toHaveBeenCalled()
    expect(ctx.busy).toBeNull()
  })

  it('fails a rejected fetch and still posts a later page url', async () => {
    const { calls, gates } = recordPosts()
    const { ctx, events, host } = urlHost('https://example.com/post')
    const pending = onResolvePageUrl(host)
    const gate = gates[0]
    if (!gate) throw new Error('missing resolve gate')
    gate.reject(new Error('offline'))
    await pending

    expect(events).toEqual([
      resolving(),
      { type: 'FAIL', err: createMemeCopy.errors.resolveFailed },
    ])
    expect(ctx.busy).toBeNull()

    ctx.urlDraft = 'https://example.com/later'
    const again = onResolvePageUrl(host)
    expect(calls[1]).toEqual({
      path: '/api/resolve-image',
      method: 'POST',
      body: { url: 'https://example.com/later' },
    })
    const next = gates[1]
    if (!next) throw new Error('missing later resolve gate')
    next.resolve(
      jsonResponse({ imageUrl: 'https://cdn.example/later.png', videoUrl: null, source: null }),
    )
    await again
    expect(ctx.busy).toBeNull()
    expect(calls).toHaveLength(2)
  })
})
