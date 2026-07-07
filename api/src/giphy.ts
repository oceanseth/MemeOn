// Giphy proxy for the meme creator. The API key is rate-limited (100 calls/hr),
// so responses are cached aggressively per warm lambda.
import { getSharedSecret } from './ssm'

export interface GiphyResult {
  id: string
  title: string
  stillUrl: string
  gifUrl: string
  mp4Url: string | null
  author: string | null
  url: string
}

const cache = new Map<string, { at: number; data: unknown }>()

async function giphyGet<T>(path: string, ttlMs: number): Promise<T> {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T
  const key = await getSharedSecret('giphy_api_key')
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`https://api.giphy.com/v1${path}${sep}api_key=${key}`)
  if (!res.ok) {
    if (hit) return hit.data as T // stale beats broken when rate-limited
    throw new Error(`giphy ${path} -> ${res.status}`)
  }
  const data = (await res.json()) as T
  cache.set(path, { at: Date.now(), data })
  return data
}

interface RawGif {
  id: string
  title?: string
  url: string
  username?: string
  images: {
    original: { url?: string; mp4?: string }
    downsized_still?: { url?: string }
    original_still?: { url?: string }
    fixed_width?: { url?: string }
  }
}

function toResult(g: RawGif): GiphyResult | null {
  const still = g.images.downsized_still?.url ?? g.images.original_still?.url
  const gif = g.images.original.url ?? g.images.fixed_width?.url
  if (!still || !gif) return null
  return {
    id: g.id,
    title: (g.title ?? '').replace(/\s*GIF.*$/i, '').trim() || 'Untitled',
    stillUrl: still,
    gifUrl: gif,
    mp4Url: g.images.original.mp4 ?? null,
    author: g.username || null,
    url: g.url,
  }
}

/** Top-level category names, cached 6h (costs 1 API call per cold lambda). */
export async function categories(): Promise<string[]> {
  const data = await giphyGet<{ data?: { name: string }[] }>('/gifs/categories', 6 * 3600_000)
  return (data.data ?? []).map((c) => c.name)
}

/** Search gifs; identical queries cached 10 min to protect the rate budget. */
export async function search(q: string, limit = 12): Promise<GiphyResult[]> {
  const data = await giphyGet<{ data?: RawGif[] }>(
    `/gifs/search?q=${encodeURIComponent(q)}&limit=${Math.min(limit, 50)}&rating=pg-13`,
    10 * 60_000,
  )
  return (data.data ?? []).map(toResult).filter((r): r is GiphyResult => !!r)
}

/** Trending feed — whatever giphy users are posting/sharing right now, term-free. */
export async function trending(limit = 50, offset = 0): Promise<GiphyResult[]> {
  const data = await giphyGet<{ data?: RawGif[] }>(
    `/gifs/trending?limit=${Math.min(limit, 50)}&offset=${offset}&rating=pg-13`,
    10 * 60_000,
  )
  return (data.data ?? []).map(toResult).filter((r): r is GiphyResult => !!r)
}
