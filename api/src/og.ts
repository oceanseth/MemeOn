// OG meta frame pipeline: composited card images (tier frame + meme art) served
// from the assets bucket, plus the crawler-facing /m/{id} HTML page.
import { Jimp } from 'jimp'
import { env } from './env'
import { assetExists, assetUrl, putAsset } from './s3'
import { TIERS, tierFor } from '../../shared/tiers'
import type { Meme } from './types'

// Card geometry: frames are 900x1200 (3:4) with an open square art window.
// generate-frames prompts leave the middle clear; the meme is pasted on top.
const CARD_W = 900
const CARD_H = 1200
const WIN = { x: 90, y: 216, w: 720, h: 720 }

const ogKey = (memeId: string, tierKey: string) => `og/${memeId}-${tierKey}.png`
export const frameKey = (tierKey: string) => `frames/${tierKey}.png`

// jimp's read()/constructor types don't unify across its generics; keep these loose.
type JimpImage = Awaited<ReturnType<typeof Jimp.read>>

async function fetchImage(url: string): Promise<JimpImage> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch image ${url} -> ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return Jimp.read(buf)
}

/**
 * Ensure the composited og image for (meme, tier) exists in the assets bucket
 * and return its public URL. Composites lazily on first request per tier.
 */
export async function ensureOgImage(meme: Meme): Promise<string> {
  const tier = tierFor(meme.reshares)
  const key = ogKey(meme.id, tier.key)
  if (await assetExists(key)) return assetUrl(key)

  const art = await fetchImage(meme.imageUrl)
  art.cover({ w: WIN.w, h: WIN.h })

  let card: JimpImage
  try {
    const frame = await fetchImage(assetUrl(frameKey(tier.key)))
    frame.cover({ w: CARD_W, h: CARD_H })
    card = frame
  } catch {
    // Frame art not generated yet: solid tier-colored card as fallback.
    card = new Jimp({
      width: CARD_W,
      height: CARD_H,
      color: hexToInt(tier.color),
    }) as unknown as JimpImage
  }
  card.composite(art, WIN.x, WIN.y)

  const png = await card.getBuffer('image/png')
  return putAsset(key, png, 'image/png')
}

function hexToInt(hex: string): number {
  // RGBA int; unsigned math (<< 8 overflows signed 32-bit for bright colors)
  return parseInt(hex.replace('#', ''), 16) * 256 + 0xff
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Crawler + human page for a meme's share URL. Crawlers read the og tags
 * (frame image reflecting current virality); humans get bounced into the SPA.
 */
export function memePageHtml(meme: Meme, ogImageUrl: string): string {
  const tier = tierFor(meme.reshares)
  const title = `${meme.title} — ${tier.name.toUpperCase()} ${tier.rarity}`
  const desc = `${meme.reshares.toLocaleString()} reshares · ${tier.hype} Collect, trade, and invest on MemeOn.`
  const pageUrl = `${env.siteOrigin}/m/${meme.id}`
  const appUrl = `/meme/${encodeURIComponent(meme.id)}`
  const video = meme.mediaType === 'video' && meme.videoUrl
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:site_name" content="MemeOn">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(ogImageUrl)}">
<meta property="og:image:width" content="${CARD_W}">
<meta property="og:image:height" content="${CARD_H}">
${video ? `<meta property="og:video" content="${esc(meme.videoUrl!)}">\n<meta property="og:video:type" content="video/mp4">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ogImageUrl)}">
<meta name="theme-color" content="${tier.color}">
<script>location.replace(${JSON.stringify(appUrl)})</script>
</head>
<body>
<p>${esc(title)} · <a href="${esc(appUrl)}">open on MemeOn</a></p>
</body>
</html>`
}

export function tierFrameList(): { key: string; name: string; url: string }[] {
  return TIERS.map((t) => ({ key: t.key, name: t.name, url: assetUrl(frameKey(t.key)) }))
}
