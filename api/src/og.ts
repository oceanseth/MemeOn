// OG meta frame pipeline: composited card images (tier frame + meme art + title
// banner) served from the assets bucket, plus the crawler-facing /m/{id} page.
import { Jimp, loadFont, measureText, measureTextHeight } from 'jimp'
import {
  SANS_32_BLACK,
  SANS_32_WHITE,
  SANS_64_BLACK,
  SANS_64_WHITE,
} from 'jimp/fonts'
import { env } from './env'
import { assetAgeSeconds, assetExists, assetUrl, putAsset, putAssetShortCache } from './s3'
import { getSharedSecret } from './ssm'
import { TIERS, tierFor } from '../../shared/tiers'
import type { Meme } from './types'

// Card geometry: frames are 900x1200 (3:4) with an open square art window.
// generate-frames prompts leave the middle clear; the meme is pasted on top.
const CARD_W = 900
const CARD_H = 1200
const WIN = { x: 90, y: 216, w: 720, h: 720 }

// v5: landscape 1200x630 og image containing the entire portrait card, so
// facebook's wide layout never crops the border or title
const ogKey = (memeId: string, tierKey: string) => `og/v5/${memeId}-${tierKey}.png`

export const OG_W = 1200
export const OG_H = 630
export const frameKey = (tierKey: string) => `frames/${tierKey}.png`

// title banner: x-range shared, but each generated frame's dark band sits at a
// slightly different height — vertical centers measured per frame art
const BANNER = { x: 110, w: 680 }
const BANNER_CENTER_Y: Record<string, number> = {
  paper: 1008,
  silver: 1012,
  holo: 1032,
  chrome: 981,
  gold: 1034,
  prismatic: 1039,
  shiny: 1001,
}

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

/** Print the title centered in the tier frame's banner band, shrinking to fit. */
async function printTitle(card: JimpImage, title: string, tierKey: string): Promise<void> {
  try {
    let text = title.slice(0, 24)
    let white = await getFont('w64')
    let black = await getFont('b64')
    if (measureText(white, text) > BANNER.w) {
      white = await getFont('w32')
      black = await getFont('b32')
      while (text.length > 4 && measureText(white, `${text}…`) > BANNER.w) {
        text = text.slice(0, -1)
      }
      if (text !== title.slice(0, 24)) text = `${text}…`
    }
    const w = measureText(white, text)
    const h = measureTextHeight(white, text, BANNER.w)
    const centerY = BANNER_CENTER_Y[tierKey] ?? 1015
    const x = BANNER.x + Math.max(0, Math.round((BANNER.w - w) / 2))
    const y = Math.round(centerY - h / 2)
    card.print({ font: black, x: x + 3, y: y + 3, text })
    card.print({ font: white, x, y, text })
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

  if (meme.mediaType === 'video') {
    // play button centered on the art + logo badge in its corner, so shares
    // read as "tap to watch" and carry the brand
    try {
      const play = await fetchImage(assetUrl('brand/play-overlay.png'))
      play.resize({ w: 300, h: 300 })
      card.composite(play, WIN.x + Math.round((WIN.w - 300) / 2), WIN.y + Math.round((WIN.h - 300) / 2))
    } catch {
      /* overlay art missing — card still works */
    }
    try {
      const logo = await fetchImage(assetUrl('brand/memeon-logo-circle-256.png'))
      logo.resize({ w: 110, h: 110 })
      card.composite(logo, WIN.x + WIN.w - 122, WIN.y + WIN.h - 122)
    } catch {
      /* ditto */
    }
  }

  await printTitle(card, meme.title, tier.key)

  // wide 1.91:1 canvas with the ENTIRE card visible: blurred art fills the
  // background, dimmed, card scaled to fit height and centered
  const wide = new Jimp({ width: OG_W, height: OG_H, color: 0x0b0d14ff }) as unknown as JimpImage
  try {
    const bgArt = art.clone()
    bgArt.cover({ w: OG_W, h: OG_H })
    bgArt.blur(12)
    wide.composite(bgArt, 0, 0)
    const dim = new Jimp({ width: OG_W, height: OG_H, color: 0x0b0d14b8 }) as unknown as JimpImage
    wide.composite(dim, 0, 0)
  } catch {
    /* solid brand background is a fine fallback */
  }
  const cardH = 590
  const cardW = Math.round((CARD_W / CARD_H) * cardH)
  card.resize({ w: cardW, h: cardH })
  wide.composite(card, Math.round((OG_W - cardW) / 2), Math.round((OG_H - cardH) / 2))

  const png = await wide.getBuffer('image/png')
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
  const desc = `${meme.reshares.toLocaleString()} views · ${(meme.uniqueRefs ?? 0).toLocaleString()} reshares · ${tier.hype} Collect, trade, and invest on MemeOn.`
  const pageUrl = `${env.siteOrigin}/m/${meme.id}`
  const video = meme.mediaType === 'video' && meme.videoUrl
  const block = `<meta property="og:site_name" content="MemeOn">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(ogImageUrl)}">
<meta property="og:image:width" content="${OG_W}">
<meta property="og:image:height" content="${OG_H}">
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
      // drop the site-wide og/twitter tags — crawlers honor the first tag seen
      .replace(/\s*<meta (?:property="og:|name="twitter:)[^>]*\/?>/g, '')
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

/**
 * Profile share card: avatar + name + stats over the dimmed brand banner.
 * Cached in S3, refreshed when older than an hour (stats drift).
 */
export async function ensureProfileOgImage(profile: {
  sub: string
  name: string
  picture: string | null
  coins: number
  collectionSize: number
}): Promise<string> {
  const key = `og/u/${profile.sub}.png`
  const age = await assetAgeSeconds(key)
  if (age !== null && age < 3600) return assetUrl(key)

  // base: the site's home banner, dimmed so the profile pops
  const canvas = new Jimp({ width: OG_W, height: OG_H, color: 0x0b0d14ff }) as unknown as JimpImage
  try {
    const banner = await fetchImage(`${env.siteOrigin}/brand/og-home.png`)
    banner.cover({ w: OG_W, h: OG_H })
    canvas.composite(banner, 0, 0)
    const dim = new Jimp({ width: OG_W, height: OG_H, color: 0x0b0d14a8 }) as unknown as JimpImage
    canvas.composite(dim, 0, 0)
  } catch {
    /* solid bg fallback */
  }

  // avatar (circle when possible), centered-left
  const AV = 250
  try {
    const avatar = profile.picture
      ? await fetchImage(profile.picture)
      : await fetchImage(assetUrl('brand/memeon-logo-circle-256.png'))
    avatar.cover({ w: AV, h: AV })
    try {
      ;(avatar as unknown as { circle: () => void }).circle()
    } catch {
      /* square avatar is fine */
    }
    canvas.composite(avatar, 150, Math.round((OG_H - AV) / 2))
  } catch {
    /* no avatar — text still carries it */
  }

  // name + stats
  try {
    const big = await getFont('w64')
    const bigShadow = await getFont('b64')
    const small = await getFont('w32')
    let name = profile.name.slice(0, 18)
    while (name.length > 4 && measureText(big, name) > 680) name = name.slice(0, -1)
    const nx = 460
    canvas.print({ font: bigShadow, x: nx + 3, y: 233, text: name })
    canvas.print({ font: big, x: nx, y: 230, text: name })
    canvas.print({
      font: small,
      x: nx + 2,
      y: 330,
      text: `on MemeOn · ${profile.coins.toLocaleString()} braincells · ${profile.collectionSize} memes`,
    })
  } catch (err) {
    console.error('profile og text failed', err)
  }

  const png = await canvas.getBuffer('image/png')
  await putAssetShortCache(key, png)
  return assetUrl(key)
}

/**
 * SPA shell with profile og tags injected (crawlers see the person; humans
 * get the app at the same URL).
 */
export async function profilePageHtml(
  profile: { sub: string; name: string; coins: number; collectionSize: number },
  ogImageUrl: string,
): Promise<string> {
  const title = `${profile.name} on MemeOn`
  const desc = `🧠 ${profile.coins.toLocaleString()} braincells · ${profile.collectionSize} memes in the binder. Collect, trade, and invest in memes on MemeOn.`
  const pageUrl = `${env.siteOrigin}/u/${encodeURIComponent(profile.sub)}`
  const block = `<meta property="og:site_name" content="MemeOn">
<meta property="og:type" content="profile">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(ogImageUrl)}">
<meta property="og:image:width" content="${OG_W}">
<meta property="og:image:height" content="${OG_H}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:image" content="${esc(ogImageUrl)}">`
  const index = await fetchIndexHtml()
  if (index) {
    return index
      .replace(/\s*<meta (?:property="og:|name="twitter:)[^>]*\/?>/g, '')
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
      .replace('</head>', `${block}\n</head>`)
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>${block}</head><body><a href="${esc(pageUrl)}">${esc(title)}</a></body></html>`
}

/**
 * Ask Facebook to re-scrape a page (busts its ~30-day og cache) — fired on
 * tier-ups so old shares upgrade their card. Silently skipped unless
 * /memeon/shared/facebook_app_token (APP_ID|APP_SECRET) exists.
 */
export async function pingFacebookRescrape(pageUrl: string): Promise<void> {
  let token: string
  try {
    token = await getSharedSecret('facebook_app_token')
  } catch {
    return
  }
  await fetch(
    `https://graph.facebook.com/v19.0/?id=${encodeURIComponent(pageUrl)}&scrape=true&access_token=${encodeURIComponent(token)}`,
    { method: 'POST', signal: AbortSignal.timeout(4000) },
  ).catch(() => {})
}

export function tierFrameList(): { key: string; name: string; url: string }[] {
  return TIERS.map((t) => ({ key: t.key, name: t.name, url: assetUrl(frameKey(t.key)) }))
}
