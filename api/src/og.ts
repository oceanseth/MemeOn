// OG meta frame pipeline: composited card images (tier frame + meme art + title
// banner) served from the assets bucket, plus the crawler-facing /m/{id} page.
import { Jimp, loadFont, measureText } from 'jimp'
import {
  SANS_32_BLACK,
  SANS_32_WHITE,
  SANS_64_BLACK,
  SANS_64_WHITE,
} from 'jimp/fonts'
import { env } from './env'
import { assetExists, assetUrl, putAsset } from './s3'
import { TIERS, tierFor } from '../../shared/tiers'
import type { Meme } from './types'

// Card geometry: frames are 900x1200 (3:4) with an open square art window.
// generate-frames prompts leave the middle clear; the meme is pasted on top.
const CARD_W = 900
const CARD_H = 1200
const WIN = { x: 90, y: 216, w: 720, h: 720 }

// v2: frames lost their tier-word footer; the meme title renders there instead
const ogKey = (memeId: string, tierKey: string) => `og/v2/${memeId}-${tierKey}.png`
export const frameKey = (tierKey: string) => `frames/${tierKey}.png`

// title banner area at the bottom of the 900x1200 frame
const BANNER = { x: 110, y: 965, w: 680, h: 130 }

// bundled next to the lambda handler (see api package script); node_modules in dev
function fontPath(bundled: string, dev: string): string {
  const root = process.env.LAMBDA_TASK_ROOT
  return root ? `${root}/fonts/${bundled}` : dev
}

const fontCache = new Map<string, Promise<Awaited<ReturnType<typeof loadFont>>>>()
function getFont(key: 'w64' | 'b64' | 'w32' | 'b32') {
  let p = fontCache.get(key)
  if (!p) {
    const paths = {
      w64: fontPath('open-sans-64-white.fnt', SANS_64_WHITE),
      b64: fontPath('open-sans-64-black.fnt', SANS_64_BLACK),
      w32: fontPath('open-sans-32-white.fnt', SANS_32_WHITE),
      b32: fontPath('open-sans-32-black.fnt', SANS_32_BLACK),
    }
    p = loadFont(paths[key])
    fontCache.set(key, p)
  }
  return p
}

/** Print the title into the banner, shrinking (64→32) and ellipsizing to fit. */
async function printTitle(card: JimpImage, title: string): Promise<void> {
  try {
    let text = title.slice(0, 24)
    let white = await getFont('w64')
    let black = await getFont('b64')
    let baseline = BANNER.y + 24
    if (measureText(white, text) > BANNER.w) {
      white = await getFont('w32')
      black = await getFont('b32')
      baseline = BANNER.y + 44
      while (text.length > 4 && measureText(white, `${text}…`) > BANNER.w) {
        text = text.slice(0, -1)
      }
      if (text !== title.slice(0, 24)) text = `${text}…`
    }
    const w = measureText(white, text)
    const x = BANNER.x + Math.max(0, Math.round((BANNER.w - w) / 2))
    card.print({ font: black, x: x + 3, y: baseline + 3, text })
    card.print({ font: white, x, y: baseline, text })
  } catch (err) {
    console.error('title print failed (fonts missing?)', err)
  }
}

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
  await printTitle(card, meme.title)

  const png = await card.getBuffer('image/png')
  return putAsset(key, png, 'image/png')
}

function hexToInt(hex: string): number {
  // RGBA int; unsigned math (<< 8 overflows signed 32-bit for bright colors)
  return parseInt(hex.replace('#', ''), 16) * 256 + 0xff
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function ogMetaBlock(meme: Meme, ogImageUrl: string): { title: string; block: string } {
  const tier = tierFor(meme.reshares)
  const title = `${meme.title} — ${tier.name.toUpperCase()} ${tier.rarity}`
  const desc = `${meme.reshares.toLocaleString()} reshares · ${tier.hype} Collect, trade, and invest on MemeOn.`
  const pageUrl = `${env.siteOrigin}/m/${meme.id}`
  const video = meme.mediaType === 'video' && meme.videoUrl
  const block = `<meta property="og:site_name" content="MemeOn">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(ogImageUrl)}">
<meta property="og:image:width" content="${CARD_W}">
<meta property="og:image:height" content="${CARD_H}">
${video ? `<meta property="og:video" content="${esc(meme.videoUrl!)}">\n<meta property="og:video:type" content="video/mp4">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ogImageUrl)}">
<meta name="theme-color" content="${tier.color}">`
  return { title, block }
}

// The SPA's index.html, fetched through the site origin and cached briefly per
// warm lambda (its asset hashes change on deploy; index is served max-age=60).
let indexCache: { html: string; at: number } | null = null

async function fetchIndexHtml(): Promise<string | null> {
  if (indexCache && Date.now() - indexCache.at < 60_000) return indexCache.html
  try {
    const res = await fetch(`${env.siteOrigin}/index.html`, {
      headers: { accept: 'text/html' },
    })
    if (!res.ok) return indexCache?.html ?? null
    const html = await res.text()
    indexCache = { html, at: Date.now() }
    return html
  } catch {
    return indexCache?.html ?? null
  }
}

/**
 * The page served at a meme's share URL (/m/{id}). Crawlers read the injected
 * og tags; humans get the full SPA at this same URL — it never redirects, so
 * copying the address bar re-shares the counting /m/ link.
 */
export async function memePageHtml(meme: Meme, ogImageUrl: string): Promise<string> {
  const { title, block } = ogMetaBlock(meme, ogImageUrl)
  const index = await fetchIndexHtml()
  if (index) {
    return index
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace('</head>', `${block}\n</head>`)
  }
  // fallback when the SPA shell can't be fetched: og tags + a manual link
  const appUrl = `/meme/${encodeURIComponent(meme.id)}`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
${block}
</head>
<body>
<p>${esc(title)} · <a href="${esc(appUrl)}">open on MemeOn</a></p>
</body>
</html>`
}

export function tierFrameList(): { key: string; name: string; url: string }[] {
  return TIERS.map((t) => ({ key: t.key, name: t.name, url: assetUrl(frameKey(t.key)) }))
}
