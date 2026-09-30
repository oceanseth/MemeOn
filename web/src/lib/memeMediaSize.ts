import type { Meme } from './types'

/**
 * The natural size of a meme's media, for the memes whose record carries none (every meme minted
 * before the server began measuring). A card's frame takes its meme's ratio, and a feed places a
 * card once, so the size has to be known *before* the card is placed: this module measures it in
 * the browser, remembers it, and tells the grids when it lands.
 *
 * It is the second imperative seam beside `cardMedia.ts`: the probes are DOM elements. An image
 * is read from its `naturalWidth` as soon as the browser has parsed the header — a large GIF
 * reports its size long before its last frame arrives. The probe asks for the very request the
 * card's own element will make (same URL, no `crossorigin`, default referrer policy), so the
 * browser answers both from one download. A video with a poster is measured from the poster, the
 * frame the card rests on; one without is read from its metadata.
 *
 * Every measurement has `MEDIA_MEASURE_BUDGET_MS`. Past it, or on an error, the meme resolves as
 * `'failed'` and its frame falls back to a square the art covers, so one slow file never holds a
 * feed back for longer than that. A resolution is final for the session: a frame never changes
 * after a grid has placed it, even if the late measurement arrives (that one is still saved, so
 * the next visit gets it right).
 *
 * Sizes are remembered per URL in memory for the session and in `localStorage` across visits,
 * capped at `MEDIA_SIZE_CACHE_CAP` entries with the oldest evicted; a full, missing or throwing
 * storage only costs the next visit a re-measure.
 */

/** The media's own pixel size. */
export interface MediaSize {
  width: number
  height: number
}

/** What is known about a meme's media: its size, or `'failed'` (errored or over budget). */
export type MediaMeasure = MediaSize | 'failed'

export interface MediaProbeTarget {
  url: string
  kind: 'image' | 'video'
}

/** Reports the media's natural size once known, or `null` when it cannot be read. */
export type MediaProbe = (target: MediaProbeTarget, done: (size: MediaSize | null) => void) => void

export const MEDIA_MEASURE_BUDGET_MS = 4000
export const MEDIA_SIZE_CACHE_CAP = 500
export const MEDIA_SIZE_STORAGE_KEY = 'memeon:media-sizes'

/** A usable pixel size: two positive, finite numbers. Anything else counts as no size at all. */
export function isMediaSize(width: unknown, height: unknown): boolean {
  return (
    typeof width === 'number' &&
    typeof height === 'number' &&
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  )
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export interface MediaSizeCache {
  get(url: string): MediaSize | undefined
  set(url: string, size: MediaSize): void
}

/* blob: and data: URLs die with the page (a mint preview), and a data: URL can be megabytes */
const persistable = (url: string): boolean => !url.startsWith('blob:') && !url.startsWith('data:')

/**
 * The size memory: a Map in insertion order, oldest first, mirrored to storage as
 * `[url, width, height]` rows. Reading and writing storage never throws out of here.
 */
export function createMediaSizeCache(
  storage: () => StorageLike | null,
  cap: number = MEDIA_SIZE_CACHE_CAP,
): MediaSizeCache {
  const entries = new Map<string, MediaSize>()
  try {
    const raw = storage()?.getItem(MEDIA_SIZE_STORAGE_KEY)
    const rows: unknown = raw ? JSON.parse(raw) : []
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (!Array.isArray(row)) continue
        const [url, width, height] = row as unknown[]
        if (typeof url === 'string' && isMediaSize(width, height)) {
          entries.set(url, { width: width as number, height: height as number })
        }
      }
    }
  } catch {
    // unreadable or corrupt: start empty, the next write replaces it
  }

  const trim = (): void => {
    for (const url of entries.keys()) {
      if (entries.size <= cap) return
      entries.delete(url)
    }
  }
  trim()

  return {
    get: (url) => entries.get(url),
    set(url, size) {
      // re-inserting moves the entry to the young end
      entries.delete(url)
      entries.set(url, { width: size.width, height: size.height })
      trim()
      try {
        const rows = [...entries]
          .filter(([key]) => persistable(key))
          .map(([key, value]) => [key, value.width, value.height])
        storage()?.setItem(MEDIA_SIZE_STORAGE_KEY, JSON.stringify(rows))
      } catch {
        // quota or a disabled storage: the session map still has it
      }
    },
  }
}

export interface MediaSizeStore {
  /** `useSyncExternalStore` contract: never fires on subscribe */
  subscribe(listener: () => void): () => void
  /** a counter that moves on every resolution */
  getSnapshot(): number
  /** the resolved measure for a URL, or `undefined` while it is unknown or in flight */
  get(url: string): MediaMeasure | undefined
  /** start measuring every target not already known or in flight; idempotent */
  request(targets: readonly MediaProbeTarget[]): void
}

export interface MediaSizeStoreOptions {
  probe: MediaProbe
  cache: MediaSizeCache
  budgetMs?: number
}

export function createMediaSizeStore({
  probe,
  cache,
  budgetMs = MEDIA_MEASURE_BUDGET_MS,
}: MediaSizeStoreOptions): MediaSizeStore {
  /* final answers for this session: a URL enters once and never changes */
  const resolved = new Map<string, MediaMeasure>()
  const inFlight = new Set<string>()
  const listeners = new Set<() => void>()
  let version = 0

  const get = (url: string): MediaMeasure | undefined => {
    const known = resolved.get(url)
    if (known) return known
    const remembered = cache.get(url)
    // pinned for the session, so evicting it from the bounded cache can never unplace a card
    if (remembered) resolved.set(url, remembered)
    return remembered
  }

  const settle = (url: string, measure: MediaMeasure): void => {
    inFlight.delete(url)
    if (resolved.has(url)) return
    resolved.set(url, measure)
    version += 1
    for (const listener of [...listeners]) listener()
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => version,
    get,
    request(targets) {
      for (const target of targets) {
        if (inFlight.has(target.url) || get(target.url)) continue
        inFlight.add(target.url)
        const timer = setTimeout(() => settle(target.url, 'failed'), budgetMs)
        probe(target, (size) => {
          clearTimeout(timer)
          const measured = size && isMediaSize(size.width, size.height) ? size : null
          // saved even when it lands past the budget: the next visit places it right
          if (measured) cache.set(target.url, measured)
          settle(target.url, measured ?? 'failed')
        })
      }
    },
  }
}

/** Which URL a meme is measured from: the poster for a video that has one, else the media. */
export function memeMediaTarget(meme: Meme): MediaProbeTarget | null {
  if (meme.mediaType === 'video' && meme.videoUrl) {
    return meme.imageUrl
      ? { url: meme.imageUrl, kind: 'image' }
      : { url: meme.videoUrl, kind: 'video' }
  }
  return meme.imageUrl ? { url: meme.imageUrl, kind: 'image' } : null
}

/* ——— the browser probes ——— */

const POLL_MS = 40

/* One timer reads every image still downloading, rather than one per probe. */
const watching = new Set<() => void>()
let poller: ReturnType<typeof setInterval> | null = null

function watch(check: () => void): void {
  watching.add(check)
  poller ??= setInterval(() => {
    for (const read of [...watching]) read()
    if (watching.size === 0 && poller !== null) {
      clearInterval(poller)
      poller = null
    }
  }, POLL_MS)
}

function probeImage(url: string, done: (size: MediaSize | null) => void): void {
  // no `crossOrigin`, no `referrerPolicy`: the exact request the card's <img> makes. High
  // priority, because a card cannot be placed until this answers: a detached image is otherwise
  // a low-priority request the browser queues behind the rest of the page.
  const image = new Image()
  image.fetchPriority = 'high'
  let finished = false
  const finish = (size: MediaSize | null): void => {
    if (finished) return
    finished = true
    watching.delete(check)
    done(size)
  }
  function check(): void {
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      finish({ width: image.naturalWidth, height: image.naturalHeight })
    }
  }
  image.addEventListener('load', () => {
    check()
    finish(null)
  })
  image.addEventListener('error', () => finish(null))
  image.src = url
  watch(check)
}

function probeVideo(url: string, done: (size: MediaSize | null) => void): void {
  const video = document.createElement('video')
  let finished = false
  const finish = (size: MediaSize | null): void => {
    if (finished) return
    finished = true
    // metadata is all it needed: release the element's connection
    video.removeAttribute('src')
    video.load()
    done(size)
  }
  video.addEventListener('loadedmetadata', () =>
    finish(
      video.videoWidth > 0 && video.videoHeight > 0
        ? { width: video.videoWidth, height: video.videoHeight }
        : null,
    ),
  )
  video.addEventListener('error', () => finish(null))
  video.muted = true
  video.preload = 'metadata'
  video.src = url
}

const browserProbe: MediaProbe = (target, done) => {
  if (target.kind === 'video') probeVideo(target.url, done)
  else probeImage(target.url, done)
}

const browserStorage = (): StorageLike | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    // a sandboxed frame throws on the getter itself
    return null
  }
}

/** The app's one store. Tests build their own with `createMediaSizeStore`. */
export const mediaSizes: MediaSizeStore = createMediaSizeStore({
  probe: (target, done) =>
    typeof document === 'undefined' ? done(null) : browserProbe(target, done),
  cache: createMediaSizeCache(browserStorage),
})

/**
 * What a meme's frame is built from: the stored `width`/`height` when the record has them,
 * else the browser's measurement — `undefined` while that is still in flight.
 */
export function memeMediaSize(
  meme: Meme,
  store: Pick<MediaSizeStore, 'get'> = mediaSizes,
): MediaMeasure | undefined {
  if (isMediaSize(meme.width, meme.height)) {
    return { width: meme.width as number, height: meme.height as number }
  }
  const target = memeMediaTarget(meme)
  return target ? store.get(target.url) : 'failed'
}

/** The probes a list of memes still needs: those without stored dims, one per URL. */
export function memeMediaTargets(memes: readonly (Meme | null | undefined)[]): MediaProbeTarget[] {
  const targets = new Map<string, MediaProbeTarget>()
  for (const meme of memes) {
    if (!meme || isMediaSize(meme.width, meme.height)) continue
    const target = memeMediaTarget(meme)
    if (target) targets.set(target.url, target)
  }
  return [...targets.values()]
}
