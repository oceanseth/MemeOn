/**
 * Remote art for a card. Satori has no network of its own here: every `<img>` src is a data URI
 * built below, so meme art, avatars and brand marks all come through `safeFetch` — the same
 * SSRF-checked path the rest of the API uses, with the same body cap (mo-100.5).
 */
import { safeFetch } from '../safeFetch'

/** Big enough for any meme giphy serves, small enough that the SVG stays sane. */
const MAX_BYTES = 6 * 1024 * 1024

// satori reads the header to size an image; these are the types it can measure.
const RENDERABLE = /^image\/(png|jpeg|jpg|gif|svg\+xml)$/i

/**
 * Fetch an image and inline it. Null when the fetch fails or the type is one satori cannot
 * measure (webp, avif) — every caller treats that as "draw the card without this picture".
 *
 * `maxBytes` is the caller's budget: a card's hero art can afford the default, six binder
 * thumbnails cannot, and an oversized one is simply dropped rather than shrunk (there is no
 * decoder in this pipeline — satori hands the bytes straight to resvg).
 */
export async function fetchArt(url: string, maxBytes = MAX_BYTES): Promise<string | null> {
  try {
    const { body, headers } = await safeFetch(url, {
      maxBytes,
      timeoutMs: 12_000,
      headers: { accept: 'image/*' },
    })
    const type = (headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    if (!RENDERABLE.test(type)) return null
    return `data:${type};base64,${body.toString('base64')}`
  } catch {
    return null
  }
}
