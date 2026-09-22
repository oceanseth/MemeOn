import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import '@/index.css'
import { Icon, type IconName } from '@/atoms/icon'

const DPR = 2
const INK_DELTA = 18
const GROUNDS = ['light', 'dark'] as const

function rgbByte(data: Uint8ClampedArray, i: number): number {
  const v = data[i]
  if (v === undefined) throw new Error(`missing ImageData byte at ${i}`)
  return Number(v)
}

function rgbAt(data: Uint8ClampedArray, i: number): [number, number, number] {
  return [rgbByte(data, i), rgbByte(data, i + 1), rgbByte(data, i + 2)]
}

function parseRgb(color: string): [number, number, number] {
  const match = color.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (match) return [Number(match[1]), Number(match[2]), Number(match[3])]
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  return rgbAt(ctx.getImageData(0, 0, 1, 1).data, 0)
}

function isInk(px: [number, number, number], bg: [number, number, number]): boolean {
  return Math.abs(px[0] - bg[0]) + Math.abs(px[1] - bg[1]) + Math.abs(px[2] - bg[2]) > INK_DELTA
}

type Raster = {
  data: Uint8ClampedArray
  bg: [number, number, number]
  width: number
  height: number
  count: number
  bboxW: number
  bboxH: number
  ratio: number
  bboxAreaRatio: number
}

async function raster(name: IconName, size: number, theme: 'light' | 'dark'): Promise<Raster> {
  document.documentElement.dataset.theme = theme
  const host = document.createElement('div')
  host.style.background = 'var(--color-background)'
  host.style.color = 'var(--color-foreground)'
  host.style.display = 'inline-flex'
  host.style.lineHeight = '0'
  document.body.append(host)
  const root = createRoot(host)
  await act(() => {
    root.render(<Icon name={name} size={size} />)
  })
  const svg = host.querySelector('svg')
  if (!svg) throw new Error(`no svg for ${name}`)
  const cs = getComputedStyle(host)
  const bg = parseRgb(cs.backgroundColor)
  const fg = cs.color
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.style.color = fg
  if ((clone.getAttribute('stroke') ?? 'currentColor') === 'currentColor') {
    clone.setAttribute('stroke', fg)
  }
  for (const el of clone.querySelectorAll('path')) {
    if (el.getAttribute('fill') === 'currentColor') el.setAttribute('fill', fg)
    if (el.getAttribute('stroke') === 'currentColor') el.setAttribute('stroke', fg)
  }
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml;charset=utf-8',
    }),
  )
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = size * DPR
    canvas.height = size * DPR
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    ctx.fillStyle = cs.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let count = 0
    let minX = canvas.width
    let minY = canvas.height
    let maxX = 0
    let maxY = 0
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4
        if (!isInk(rgbAt(data, i), bg)) continue
        count++
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
    return {
      data,
      bg,
      width: canvas.width,
      height: canvas.height,
      count,
      bboxW: (maxX - minX + 1) / DPR,
      bboxH: (maxY - minY + 1) / DPR,
      ratio: count / (canvas.width * canvas.height),
      bboxAreaRatio:
        count === 0 ? 0 : ((maxX - minX + 1) * (maxY - minY + 1)) / (canvas.width * canvas.height),
    }
  } finally {
    URL.revokeObjectURL(url)
    root.unmount()
    host.remove()
  }
}

function sample(
  rastered: Raster,
  cssPx: number,
  vbX: number,
  vbY: number,
): [number, number, number] {
  const x = Math.round((vbX / 24) * cssPx * DPR)
  const y = Math.round((vbY / 24) * cssPx * DPR)
  const i = (y * rastered.width + x) * 4
  return rgbAt(rastered.data, i)
}

function neighborhoodInk(rastered: Raster, cssPx: number, vbX: number, vbY: number): boolean {
  for (const dx of [-1, 0, 1]) {
    for (const dy of [-1, 0, 1]) {
      const px = sample(rastered, cssPx, vbX + dx * 0.35, vbY + dy * 0.35)
      if (isInk(px, rastered.bg)) return true
    }
  }
  return false
}

afterEach(() => {
  delete document.documentElement.dataset.theme
})

describe('icon remainder family runtime (mo-6ro.3)', () => {
  it('keeps globe’s ink bbox within 8% of circle-plus at 16', async () => {
    for (const theme of GROUNDS) {
      const globe = await raster('globe', 16, theme)
      const plus = await raster('circle-plus', 16, theme)
      expect(Math.abs(globe.bboxW - plus.bboxW) / plus.bboxW).toBeLessThanOrEqual(0.08)
      expect(Math.abs(globe.bboxH - plus.bboxH) / plus.bboxH).toBeLessThanOrEqual(0.08)
    }
  })

  it('keeps square-play’s ink bbox within 1 CSS px of square at 18', async () => {
    for (const theme of GROUNDS) {
      const play = await raster('square-play', 18, theme)
      const box = await raster('square', 18, theme)
      expect(Math.abs(play.bboxW - box.bboxW)).toBeLessThanOrEqual(1)
      expect(Math.abs(play.bboxH - box.bboxH)).toBeLessThanOrEqual(1)
    }
  })

  it('keeps theater, satellite, and handshake readable at 16', async () => {
    for (const theme of GROUNDS) {
      for (const name of ['theater', 'satellite', 'handshake'] as const) {
        const drawn = await raster(name, 16, theme)
        expect(drawn.ratio, `${theme} ${name} ink ratio ${drawn.ratio}`).toBeGreaterThanOrEqual(
          0.12,
        )
        expect(drawn.ratio, `${theme} ${name} ink ratio ${drawn.ratio}`).toBeLessThanOrEqual(0.5)
        expect(
          drawn.bboxAreaRatio,
          `${theme} ${name} bbox ${drawn.bboxW.toFixed(2)}x${drawn.bboxH.toFixed(2)} area ${drawn.bboxAreaRatio}`,
        ).toBeGreaterThanOrEqual(0.5)
      }
    }
  })

  it('fills contrast’s D heavier than sun and leaves the left half open', async () => {
    for (const theme of GROUNDS) {
      for (const size of [16, 22] as const) {
        const contrast = await raster('contrast', size, theme)
        const sun = await raster('sun', size, theme)
        expect(contrast.ratio).toBeGreaterThanOrEqual(sun.ratio * 1.3)
        const leftInterior = sample(contrast, size, 9.5, 12)
        expect(isInk(leftInterior, contrast.bg)).toBe(false)
        expect(neighborhoodInk(contrast, size, 2.75, 12)).toBe(true)
      }
    }
  })
})
