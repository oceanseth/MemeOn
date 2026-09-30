import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMediaSizeCache,
  createMediaSizeStore,
  MEDIA_MEASURE_BUDGET_MS,
  MEDIA_SIZE_STORAGE_KEY,
  memeMediaTargets,
  type MediaProbeTarget,
  type MediaSize,
} from './memeMediaSize'
import type { Meme } from './types'

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
    storage: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        map.set(key, value)
      },
    },
  }
}

const throwingStorage = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
}

describe('createMediaSizeCache', () => {
  it('misses an unknown URL and hits one it was given', () => {
    const cache = createMediaSizeCache(() => memoryStorage().storage)
    expect(cache.get('/a.gif')).toBeUndefined()
    cache.set('/a.gif', { width: 300, height: 200 })
    expect(cache.get('/a.gif')).toEqual({ width: 300, height: 200 })
  })

  it('round-trips through storage, so a repeat visit knows the size at once', () => {
    const { storage } = memoryStorage()
    createMediaSizeCache(() => storage).set('/a.gif', { width: 300, height: 200 })
    const nextVisit = createMediaSizeCache(() => storage)
    expect(nextVisit.get('/a.gif')).toEqual({ width: 300, height: 200 })
  })

  it('evicts the oldest entry at the cap, in memory and in storage', () => {
    const { storage, map } = memoryStorage()
    const cache = createMediaSizeCache(() => storage, 2)
    cache.set('/a', { width: 1, height: 1 })
    cache.set('/b', { width: 2, height: 2 })
    // touching `/a` again makes it the youngest
    cache.set('/a', { width: 1, height: 1 })
    cache.set('/c', { width: 3, height: 3 })
    expect(cache.get('/b')).toBeUndefined()
    expect(cache.get('/a')).toEqual({ width: 1, height: 1 })
    expect(cache.get('/c')).toEqual({ width: 3, height: 3 })
    expect(JSON.parse(map.get(MEDIA_SIZE_STORAGE_KEY) ?? '[]')).toEqual([
      ['/a', 1, 1],
      ['/c', 3, 3],
    ])
    // a stored list longer than the cap is trimmed on load, oldest first
    const reloaded = createMediaSizeCache(() => storage, 1)
    expect(reloaded.get('/a')).toBeUndefined()
    expect(reloaded.get('/c')).toEqual({ width: 3, height: 3 })
  })

  it('keeps working in memory when storage throws, is missing, or holds garbage', () => {
    const throwing = createMediaSizeCache(() => throwingStorage)
    expect(() => throwing.set('/a', { width: 4, height: 3 })).not.toThrow()
    expect(throwing.get('/a')).toEqual({ width: 4, height: 3 })

    const missing = createMediaSizeCache(() => null)
    missing.set('/a', { width: 4, height: 3 })
    expect(missing.get('/a')).toEqual({ width: 4, height: 3 })

    const getterThrows = createMediaSizeCache(() => {
      throw new Error('SecurityError')
    })
    expect(() => getterThrows.set('/a', { width: 4, height: 3 })).not.toThrow()

    const { storage, map } = memoryStorage()
    map.set(MEDIA_SIZE_STORAGE_KEY, '{not json')
    expect(createMediaSizeCache(() => storage).get('/a')).toBeUndefined()
    map.set(MEDIA_SIZE_STORAGE_KEY, JSON.stringify([['/a', 0, 3], ['/b', 'x', 3], 7, ['/c', 4, 3]]))
    const partial = createMediaSizeCache(() => storage)
    expect(partial.get('/a')).toBeUndefined()
    expect(partial.get('/b')).toBeUndefined()
    expect(partial.get('/c')).toEqual({ width: 4, height: 3 })
  })

  it('never writes page-scoped blob: or data: URLs to storage', () => {
    const { storage, map } = memoryStorage()
    const cache = createMediaSizeCache(() => storage)
    cache.set('blob:http://x/1', { width: 1, height: 1 })
    cache.set('data:image/png;base64,AAAA', { width: 1, height: 1 })
    cache.set('/kept.png', { width: 2, height: 1 })
    expect(cache.get('blob:http://x/1')).toEqual({ width: 1, height: 1 })
    expect(JSON.parse(map.get(MEDIA_SIZE_STORAGE_KEY) ?? '[]')).toEqual([['/kept.png', 2, 1]])
  })
})

describe('createMediaSizeStore', () => {
  type Pending = { target: MediaProbeTarget; done: (size: MediaSize | null) => void }
  let probes: Pending[]

  beforeEach(() => {
    vi.useFakeTimers()
    probes = []
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const build = (storage = memoryStorage().storage) =>
    createMediaSizeStore({
      probe: (target, done) => probes.push({ target, done }),
      cache: createMediaSizeCache(() => storage),
    })
  const image = (url: string): MediaProbeTarget => ({ url, kind: 'image' })

  it('measures each URL once and tells subscribers when it lands', () => {
    const store = build()
    const listener = vi.fn()
    store.subscribe(listener)
    store.request([image('/a'), image('/a'), image('/b')])
    store.request([image('/a')])
    expect(probes.map((probe) => probe.target.url)).toEqual(['/a', '/b'])
    expect(store.get('/a')).toBeUndefined()
    const before = store.getSnapshot()

    probes[0]?.done({ width: 300, height: 200 })
    expect(store.get('/a')).toEqual({ width: 300, height: 200 })
    expect(store.getSnapshot()).not.toBe(before)
    expect(listener).toHaveBeenCalledTimes(1)
    // a resolved URL is never measured again
    store.request([image('/a')])
    expect(probes).toHaveLength(2)
  })

  it('does not fire on subscribe', () => {
    const store = build()
    const listener = vi.fn()
    store.subscribe(listener)
    expect(listener).not.toHaveBeenCalled()
  })

  it('answers from the remembered sizes without probing', () => {
    const { storage } = memoryStorage()
    createMediaSizeCache(() => storage).set('/a', { width: 9, height: 16 })
    const store = build(storage)
    expect(store.get('/a')).toEqual({ width: 9, height: 16 })
    store.request([image('/a')])
    expect(probes).toHaveLength(0)
  })

  it('falls back after the budget, releases the feed, and never changes that answer', () => {
    const { storage } = memoryStorage()
    const store = build(storage)
    const listener = vi.fn()
    store.subscribe(listener)
    store.request([image('/slow')])
    vi.advanceTimersByTime(MEDIA_MEASURE_BUDGET_MS - 1)
    expect(store.get('/slow')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(store.get('/slow')).toBe('failed')
    expect(listener).toHaveBeenCalledTimes(1)

    // the size lands late: this session keeps the placed square, the next visit gets the size
    probes[0]?.done({ width: 400, height: 100 })
    expect(store.get('/slow')).toBe('failed')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(createMediaSizeCache(() => storage).get('/slow')).toEqual({ width: 400, height: 100 })
  })

  it('resolves an unreadable media as failed at once, without waiting on the budget', () => {
    const store = build()
    store.request([image('/broken')])
    probes[0]?.done(null)
    expect(store.get('/broken')).toBe('failed')
    probes.length = 0
    // a garbage size from a probe is no size
    store.request([image('/zero')])
    probes[0]?.done({ width: 0, height: 0 })
    expect(store.get('/zero')).toBe('failed')
  })
})

describe('memeMediaTargets', () => {
  const meme = (id: string, partial: Partial<Meme>): Meme =>
    ({ id, mediaType: 'image', imageUrl: `/${id}.png`, videoUrl: null, ...partial }) as Meme

  it('lists one probe per URL, only for memes without stored dims', () => {
    expect(
      memeMediaTargets([
        meme('a', {}),
        meme('b', { width: 10, height: 20 }),
        meme('a2', { imageUrl: '/a.png' }),
        null,
        undefined,
        meme('v', { mediaType: 'video', videoUrl: '/v.mp4', imageUrl: '' }),
      ]),
    ).toEqual([
      { url: '/a.png', kind: 'image' },
      { url: '/v.mp4', kind: 'video' },
    ])
  })
})
