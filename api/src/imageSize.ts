/**
 * Intrinsic pixel dimensions from an image *header* (PNG IHDR, GIF logical screen
 * descriptor, JPEG SOFn) — the first ~64 KB is plenty, so nothing decodes the file.
 * Every failure path returns null: dimensions are best-effort and must never fail a mint.
 */
import { safeFetch } from './safeFetch'

export interface ImageSize {
  width: number
  height: number
}

/** How much of the file we ask for; JPEG SOFn virtually always sits well inside this. */
export const HEADER_BYTES = 64 * 1024

/** Hard cap when the origin ignores the Range header and streams the whole file. */
const MAX_FETCH_BYTES = 512 * 1024

const valid = (width: number, height: number): ImageSize | null =>
  Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0
    ? { width, height }
    : null

function pngSize(buf: Buffer): ImageSize | null {
  // 8-byte signature, then the IHDR chunk: length(4) 'IHDR'(4) width(4) height(4)
  if (buf.length < 24) return null
  if (!buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return null
  if (buf.toString('latin1', 12, 16) !== 'IHDR') return null
  return valid(buf.readUInt32BE(16), buf.readUInt32BE(20))
}

function gifSize(buf: Buffer): ImageSize | null {
  if (buf.length < 10) return null
  const sig = buf.toString('latin1', 0, 6)
  if (sig !== 'GIF87a' && sig !== 'GIF89a') return null
  return valid(buf.readUInt16LE(6), buf.readUInt16LE(8))
}

/** SOF0–SOF15 minus DHT (C4), JPG (C8) and DAC (CC), which are not frame headers. */
const isSof = (marker: number): boolean =>
  marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc

function jpegSize(buf: Buffer): ImageSize | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let i = 2
  while (i + 3 < buf.length) {
    if (buf[i] !== 0xff) return null // lost sync — corrupt stream
    // fill bytes: any number of 0xFF may pad a marker
    while (buf[i + 1] === 0xff && i + 3 < buf.length) i++
    const marker = buf[i + 1] as number
    if (marker === 0xd9 || marker === 0xda) return null // EOI / SOS before any SOFn
    // standalone markers (TEM, RSTn) carry no length word
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2
      continue
    }
    const length = buf.readUInt16BE(i + 2)
    if (length < 2) return null
    if (isSof(marker)) {
      if (i + 9 > buf.length) return null
      return valid(buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5))
    }
    i += 2 + length
  }
  return null
}

/** Sniff the container and read its header; null for anything unknown or truncated. */
export function imageSizeFromBuffer(buf: Buffer): ImageSize | null {
  return pngSize(buf) ?? gifSize(buf) ?? jpegSize(buf)
}

/**
 * Fetch just enough of `url` to read its dimensions. SSRF-guarded by `safeFetch`
 * (`assertPublicUrl` runs pre-fetch and on every redirect hop). A Range request keeps
 * the transfer to one header's worth; origins that ignore it are body-capped instead.
 */
export async function measureImageUrl(url: string): Promise<ImageSize | null> {
  try {
    const res = await safeFetch(url, {
      headers: { accept: 'image/*', range: `bytes=0-${HEADER_BYTES - 1}` },
      maxBytes: MAX_FETCH_BYTES,
      timeoutMs: 5000,
    })
    return imageSizeFromBuffer(res.body)
  } catch {
    return null
  }
}
