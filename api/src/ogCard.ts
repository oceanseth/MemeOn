import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Jimp } from 'jimp'

export const MEME_OG_WIDTH = 960
export const MEME_OG_HEIGHT = 1200

// The art window takes the media's own ratio, clamped like the web grid (1:2..2:1).
const CARD_ASPECT_MIN = 0.5
const CARD_ASPECT_MAX = 2
// Longest aperture side; the master portrait frame's aperture height, so a
// classic portrait meme still yields the familiar 960x1200 card.
const APERTURE_FIT = 974

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface RoundedRect extends Rect {
  radius: number
}

export interface OgFrameManifest {
  version: 1
  units: 'px'
  canvas: {
    width: number
    height: number
    cssWidth: number
    cssHeight: number
    deviceScaleFactor: number
  }
  frame: Rect
  backing: RoundedRect
  aperture: RoundedRect
  sourceSafeRect: Rect
  tiers: Record<string, string>
}

export interface OgFrameBundle {
  frame: Buffer
  manifest: OgFrameManifest
  tierKey: string
}

interface ComposeCollectibleCardOptions {
  art: Buffer
  frame: Buffer
  manifest: OgFrameManifest
  mediaType?: 'image' | 'video'
}

type JimpImage = Awaited<ReturnType<typeof Jimp.read>>

const CANVAS_COLOR = 0x0b0d14ff
const APERTURE_COLOR = 0x151722ff

function frameDirectoryCandidates(taskRoot = process.env.LAMBDA_TASK_ROOT): string[] {
  const candidates: string[] = []
  if (taskRoot) candidates.push(path.join(taskRoot, 'assets', 'og-frames'))
  candidates.push(fileURLToPath(new URL('../assets/og-frames/', import.meta.url)))
  return candidates
}

function assertInteger(name: string, value: unknown): asserts value is number {
  if (!Number.isInteger(value)) throw new Error(`invalid OG frame manifest: ${name}`)
}

function assertRect(name: string, value: Rect | RoundedRect, rounded = false): void {
  for (const field of ['x', 'y', 'width', 'height'] as const) {
    assertInteger(`${name}.${field}`, value[field])
  }
  if (value.width <= 0 || value.height <= 0) {
    throw new Error(`invalid OG frame manifest: ${name} dimensions`)
  }
  if (rounded) assertInteger(`${name}.radius`, (value as RoundedRect).radius)
}

export function validateOgFrameManifest(value: unknown): OgFrameManifest {
  if (!value || typeof value !== 'object') throw new Error('invalid OG frame manifest')
  const manifest = value as OgFrameManifest
  if (manifest.version !== 1 || manifest.units !== 'px') {
    throw new Error('unsupported OG frame manifest version')
  }
  if (!manifest.canvas || !manifest.frame || !manifest.aperture || !manifest.sourceSafeRect) {
    throw new Error('incomplete OG frame manifest')
  }
  assertInteger('canvas.width', manifest.canvas.width)
  assertInteger('canvas.height', manifest.canvas.height)
  assertInteger('canvas.cssWidth', manifest.canvas.cssWidth)
  assertInteger('canvas.cssHeight', manifest.canvas.cssHeight)
  assertInteger('canvas.deviceScaleFactor', manifest.canvas.deviceScaleFactor)
  if (manifest.canvas.width !== MEME_OG_WIDTH || manifest.canvas.height !== MEME_OG_HEIGHT) {
    throw new Error('OG frame manifest canvas must be 960x1200')
  }
  assertRect('frame', manifest.frame)
  assertRect('backing', manifest.backing, true)
  assertRect('aperture', manifest.aperture, true)
  assertRect('sourceSafeRect', manifest.sourceSafeRect)
  if (!manifest.tiers || typeof manifest.tiers.paper !== 'string') {
    throw new Error('OG frame manifest requires a paper tier')
  }
  for (const [name, rect] of [
    ['frame', manifest.frame],
    ['aperture', manifest.aperture],
    ['sourceSafeRect', manifest.sourceSafeRect],
  ] as const) {
    if (
      rect.x < 0 ||
      rect.y < 0 ||
      rect.x + rect.width > manifest.canvas.width ||
      rect.y + rect.height > manifest.canvas.height
    ) {
      throw new Error(`invalid OG frame manifest: ${name} outside canvas`)
    }
  }
  const safe = manifest.sourceSafeRect
  const aperture = manifest.aperture
  if (
    safe.x < aperture.x ||
    safe.y < aperture.y ||
    safe.x + safe.width > aperture.x + aperture.width ||
    safe.y + safe.height > aperture.y + aperture.height
  ) {
    throw new Error('invalid OG frame manifest: sourceSafeRect outside aperture')
  }
  return manifest
}

let cachedManifest: Promise<OgFrameManifest> | null = null

/** The bundled frame manifest alone, read once per process (card geometry for meta tags). */
export function loadOgFrameManifest(): Promise<OgFrameManifest> {
  if (!cachedManifest) {
    cachedManifest = (async () => {
      let lastError: unknown
      for (const directory of frameDirectoryCandidates()) {
        try {
          const raw = await readFile(path.join(directory, 'manifest.json'), 'utf8')
          return validateOgFrameManifest(JSON.parse(raw))
        } catch (error) {
          lastError = error
        }
      }
      throw new Error('bundled OG frame assets are unavailable', { cause: lastError })
    })()
    cachedManifest.catch(() => {
      cachedManifest = null
    })
  }
  return cachedManifest
}

export async function loadOgFrameBundle(tierKey: string): Promise<OgFrameBundle> {
  let lastError: unknown
  for (const directory of frameDirectoryCandidates()) {
    try {
      const rawManifest = await readFile(path.join(directory, 'manifest.json'), 'utf8')
      const manifest = validateOgFrameManifest(JSON.parse(rawManifest))
      const normalizedTier = tierKey.toLowerCase()
      const resolvedTier = manifest.tiers[normalizedTier] ? normalizedTier : 'paper'
      const filename = manifest.tiers[resolvedTier]
      if (!filename || path.basename(filename) !== filename) {
        throw new Error(`invalid OG frame filename for ${resolvedTier}`)
      }
      return {
        frame: await readFile(path.join(directory, filename)),
        manifest,
        tierKey: resolvedTier,
      }
    } catch (error) {
      lastError = error
    }
  }
  throw new Error('bundled OG frame assets are unavailable', { cause: lastError })
}

export interface CardGeometry {
  width: number
  height: number
  aperture: RoundedRect
}

/**
 * Card dimensions for one meme: the aperture takes the art's own (clamped)
 * ratio and the master frame's chrome margins wrap around it unchanged.
 */
export function collectibleCardGeometry(
  manifest: OgFrameManifest,
  artWidth: number,
  artHeight: number,
): CardGeometry {
  const aperture = manifest.aperture
  const margins = {
    left: aperture.x,
    top: aperture.y,
    right: manifest.canvas.width - (aperture.x + aperture.width),
    bottom: manifest.canvas.height - (aperture.y + aperture.height),
  }
  const raw = artWidth > 0 && artHeight > 0 ? artWidth / artHeight : 1
  const ratio = Math.min(CARD_ASPECT_MAX, Math.max(CARD_ASPECT_MIN, raw))
  const apertureWidth = ratio >= 1 ? APERTURE_FIT : Math.round(APERTURE_FIT * ratio)
  const apertureHeight = ratio >= 1 ? Math.round(APERTURE_FIT / ratio) : APERTURE_FIT
  return {
    width: margins.left + apertureWidth + margins.right,
    height: margins.top + apertureHeight + margins.bottom,
    aperture: {
      x: margins.left,
      y: margins.top,
      width: apertureWidth,
      height: apertureHeight,
      radius: aperture.radius,
    },
  }
}

// 9-slice insets for reshaping the master frame overlay: corners (rounding,
// star badge top-right) copy verbatim, the bands between them stretch.
const FRAME_SLICE = { left: 220, top: 250, right: 290, bottom: 220 }

function reshapeFrame(frame: JimpImage, width: number, height: number): JimpImage {
  if (frame.bitmap.width === width && frame.bitmap.height === height) return frame
  const out = new Jimp({ width, height, color: 0x00000000 }) as unknown as JimpImage
  const sx = [0, FRAME_SLICE.left, frame.bitmap.width - FRAME_SLICE.right, frame.bitmap.width]
  const sy = [0, FRAME_SLICE.top, frame.bitmap.height - FRAME_SLICE.bottom, frame.bitmap.height]
  const dx = [0, FRAME_SLICE.left, width - FRAME_SLICE.right, width]
  const dy = [0, FRAME_SLICE.top, height - FRAME_SLICE.bottom, height]
  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 3; row++) {
      const sourceW = sx[column + 1] - sx[column]
      const sourceH = sy[row + 1] - sy[row]
      const destW = dx[column + 1] - dx[column]
      const destH = dy[row + 1] - dy[row]
      if (destW <= 0 || destH <= 0 || sourceW <= 0 || sourceH <= 0) continue
      const piece = frame.clone().crop({ x: sx[column], y: sy[row], w: sourceW, h: sourceH })
      if (destW !== sourceW || destH !== sourceH) piece.resize({ w: destW, h: destH })
      out.composite(piece, dx[column], dy[row])
    }
  }
  return out
}

function insideRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
  if (radius <= 0) return true
  const nearestX = Math.max(radius, Math.min(x, width - radius - 1))
  const nearestY = Math.max(radius, Math.min(y, height - radius - 1))
  const dx = x - nearestX
  const dy = y - nearestY
  return dx * dx + dy * dy <= radius * radius
}

function clipRounded(image: JimpImage, radius: number): void {
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, index) => {
    if (!insideRoundedRect(x, y, image.bitmap.width, image.bitmap.height, radius)) {
      image.bitmap.data[index + 3] = 0
    }
  })
}

function drawPlayBadge(image: JimpImage): void {
  const size = 174
  const radius = size / 2
  const badge = new Jimp({ width: size, height: size, color: 0x00000000 }) as unknown as JimpImage
  badge.scan(0, 0, size, size, (x, y, index) => {
    const dx = x + 0.5 - radius
    const dy = y + 0.5 - radius
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance <= radius) {
      const ring = distance >= radius - 7
      const color = ring ? [255, 255, 255, 232] : [11, 13, 20, 190]
      badge.bitmap.data[index] = color[0]
      badge.bitmap.data[index + 1] = color[1]
      badge.bitmap.data[index + 2] = color[2]
      badge.bitmap.data[index + 3] = color[3]
    }
  })
  const triangle = [
    { x: 70, y: 53 },
    { x: 70, y: 121 },
    { x: 124, y: 87 },
  ]
  badge.scan(0, 0, size, size, (x, y, index) => {
    const [a, b, c] = triangle
    const sign = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number },
    ) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
    const point = { x, y }
    const d1 = sign(point, a, b)
    const d2 = sign(point, b, c)
    const d3 = sign(point, c, a)
    if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) {
      badge.bitmap.data[index] = 255
      badge.bitmap.data[index + 1] = 255
      badge.bitmap.data[index + 2] = 255
      badge.bitmap.data[index + 3] = 255
    }
  })
  image.composite(
    badge,
    Math.round((image.bitmap.width - size) / 2),
    Math.round((image.bitmap.height - size) / 2),
  )
}

/**
 * Compose one collectible card without network, storage, or environment
 * access. The card takes the art's own (clamped) ratio — the frame chrome
 * wraps the art snug, matching the site's grid, and the art fills the
 * aperture edge to edge (center-cropped only past the ratio clamp).
 */
export async function composeCollectibleOgCard({
  art: artBuffer,
  frame: frameBuffer,
  manifest: rawManifest,
  mediaType = 'image',
}: ComposeCollectibleCardOptions): Promise<Buffer> {
  const manifest = validateOgFrameManifest(rawManifest)
  const [art, frame] = await Promise.all([Jimp.read(artBuffer), Jimp.read(frameBuffer)])
  if (frame.bitmap.width !== MEME_OG_WIDTH || frame.bitmap.height !== MEME_OG_HEIGHT) {
    throw new Error('OG frame overlay must be 960x1200')
  }

  const geometry = collectibleCardGeometry(manifest, art.bitmap.width, art.bitmap.height)
  const canvas = new Jimp({
    width: geometry.width,
    height: geometry.height,
    color: CANVAS_COLOR,
  }) as unknown as JimpImage
  const aperture = geometry.aperture
  const window = new Jimp({
    width: aperture.width,
    height: aperture.height,
    color: APERTURE_COLOR,
  }) as unknown as JimpImage

  art.cover({ w: aperture.width, h: aperture.height })
  window.composite(art, 0, 0)
  if (mediaType === 'video') drawPlayBadge(window)
  clipRounded(window, aperture.radius)

  canvas.composite(window, aperture.x, aperture.y)
  canvas.composite(reshapeFrame(frame, geometry.width, geometry.height), 0, 0)
  return canvas.getBuffer('image/png')
}
