import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Jimp } from 'jimp'

export const MEME_OG_WIDTH = 960
export const MEME_OG_HEIGHT = 1200

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

function containSize(source: JimpImage, bounds: Rect): { width: number; height: number } {
  const scale = Math.min(bounds.width / source.bitmap.width, bounds.height / source.bitmap.height)
  return {
    width: Math.max(1, Math.round(source.bitmap.width * scale)),
    height: Math.max(1, Math.round(source.bitmap.height * scale)),
  }
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

/** Compose one collectible portrait card without network, storage, or environment access. */
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

  const canvas = new Jimp({
    width: MEME_OG_WIDTH,
    height: MEME_OG_HEIGHT,
    color: CANVAS_COLOR,
  }) as unknown as JimpImage
  const aperture = manifest.aperture
  const window = new Jimp({
    width: aperture.width,
    height: aperture.height,
    color: APERTURE_COLOR,
  }) as unknown as JimpImage

  const matte = art.clone()
  matte.cover({ w: aperture.width, h: aperture.height })
  matte.blur(24)
  matte.opacity(0.45)
  window.composite(matte, 0, 0)
  const dim = new Jimp({
    width: aperture.width,
    height: aperture.height,
    color: 0x15172247,
  }) as unknown as JimpImage
  window.composite(dim, 0, 0)

  const safe = manifest.sourceSafeRect
  const safeLocal = {
    x: safe.x - aperture.x,
    y: safe.y - aperture.y,
    width: safe.width,
    height: safe.height,
  }
  const contained = containSize(art, safeLocal)
  art.resize({ w: contained.width, h: contained.height })
  window.composite(
    art,
    safeLocal.x + Math.round((safeLocal.width - contained.width) / 2),
    safeLocal.y + Math.round((safeLocal.height - contained.height) / 2),
  )
  if (mediaType === 'video') drawPlayBadge(window)
  clipRounded(window, aperture.radius)

  canvas.composite(window, aperture.x, aperture.y)
  canvas.composite(frame, 0, 0)
  return canvas.getBuffer('image/png')
}
