/**
 * HTML/CSS → SVG → PNG, the pipeline `@vercel/og` runs: satori lays out flexbox and type and
 * emits SVG; resvg rasterises it. `@vercel/og` itself is a Next.js/edge wrapper around these two —
 * this lambda is neither, so it uses them directly.
 *
 * resvg is the *wasm* build on purpose: `@resvg/resvg-js` is a native napi addon, and the zip
 * is built on a developer's mac for an arm64 lambda. A `.wasm` file is the same bytes everywhere.
 */
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import satori from 'satori'
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import { safeFetch } from '../safeFetch'
import { loadFonts } from './fonts'
import type { OgNode } from './jsx'

const require = createRequire(import.meta.url)

/** Bundled beside the handler in the lambda zip; out of node_modules locally. See `fontFile`. */
function wasmPath(): string {
  const root = process.env.LAMBDA_TASK_ROOT
  return root ? `${root}/vendor/resvg.wasm` : require.resolve('@resvg/resvg-wasm/index_bg.wasm')
}

// initWasm throws if it runs twice, so a warm lambda must reuse the first promise.
let wasm: Promise<void> | null = null
const initResvg = (): Promise<void> => (wasm ??= initWasm(readFile(wasmPath()).then((b) => b.buffer as ArrayBuffer)))

/**
 * Emoji: neither brand face has any, and an unmapped glyph rasterises as a tofu box. Satori hands
 * each emoji segment here to be replaced with an image, so they come from twemoji's SVGs. Cached
 * per warm lambda; a miss draws nothing, which beats a box.
 */
const emojiCache = new Map<string, string>()

/** twemoji's filenames: codepoints in hex, joined by `-`, with the VS16 selector dropped. */
function twemojiCode(emoji: string): string {
  const zwj = emoji.includes('‍')
  return [...(zwj ? emoji : emoji.replace(/️/g, ''))]
    .map((ch) => ch.codePointAt(0)!.toString(16))
    .join('-')
}

async function emojiDataUri(emoji: string): Promise<string> {
  const code = twemojiCode(emoji)
  const hit = emojiCache.get(code)
  if (hit !== undefined) return hit
  let uri = ''
  try {
    const { body } = await safeFetch(
      `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${code}.svg`,
      { maxBytes: 256 * 1024, timeoutMs: 3000, headers: { accept: 'image/svg+xml' } },
    )
    uri = `data:image/svg+xml;base64,${body.toString('base64')}`
  } catch {
    /* no emoji art — the segment renders empty */
  }
  emojiCache.set(code, uri)
  return uri
}

export interface CardSize {
  width: number
  height: number
}

/** The open graph canvas every crawler wants: 1.91:1, the size Facebook and X both sample at. */
export const OG_SIZE: CardSize = { width: 1200, height: 630 }

/** Lay a card out and rasterise it. */
export async function renderCard(node: OgNode, size: CardSize = OG_SIZE): Promise<Buffer> {
  const [fonts] = await Promise.all([loadFonts(), initResvg()])
  const svg = await satori(node as Parameters<typeof satori>[0], {
    ...size,
    fonts,
    loadAdditionalAsset: async (code, segment) => (code === 'emoji' ? emojiDataUri(segment) : ''),
  })
  return Buffer.from(
    new Resvg(svg, { fitTo: { mode: 'width', value: size.width } }).render().asPng(),
  )
}
