import { act } from 'react'
import type { Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@/index.css'
import { MEME_ASPECT_MAX, MEME_ASPECT_MIN } from '../lib/memeCardModel'
import type { Meme } from '../lib/types'
import type { AppStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { listedHolo, paperMeme, silverMeme } from '../test/fixtures'
import { settle } from '../test/runtime'
import { mountSignedInRoot, unmountSignedInRoot } from '../test/signedInHost'
import { MarketplaceView } from '../views/MarketplaceView'

vi.mock('../lib/firebase', () => ({
  firebaseSignOut: vi.fn(),
  firebaseSignIn: vi.fn(async () => {}),
}))

/* Real images of known natural size, drawn here: the feed has to find their size itself. */
const SIZES = [
  [300, 200],
  [200, 300],
  [400, 400],
  // past the clamp both ways: the frame stops at 1:2 / 2:1 and the art centre-crops
  [100, 400],
  [800, 200],
] as const

async function imageUrl(width: number, height: number, hue: number): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('no 2d context')
  context.fillStyle = `hsl(${hue} 70% 50%)`
  context.fillRect(0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('canvas produced no blob')
  return URL.createObjectURL(blob)
}

const templates = [paperMeme, silverMeme, listedHolo]

async function feedWithoutDims(): Promise<Meme[]> {
  return Promise.all(
    SIZES.map(async ([width, height], index) => {
      const template = templates[index % templates.length] as Meme
      // no `width` / `height`: every meme on dev today looks like this
      const { width: _w, height: _h, ...rest } = template
      return {
        ...rest,
        id: `snug-${width}x${height}`,
        title: `snug ${width}×${height}`,
        imageUrl: await imageUrl(width, height, index * 60),
      }
    }),
  )
}

async function tick(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
    await settle()
  })
}

async function eventually(assertion: () => void, timeout = 3000): Promise<void> {
  const deadline = performance.now() + timeout
  let failure: unknown
  while (performance.now() < deadline) {
    try {
      assertion()
      return
    } catch (error) {
      failure = error
      await tick()
    }
  }
  throw failure
}

const px = (value: string): number => Number.parseFloat(value)

/** A card's box in page coordinates, so scrolling does not read as movement. */
function pageBox(element: HTMLElement): { x: number; y: number; w: number; h: number } {
  const box = element.getBoundingClientRect()
  return { x: box.left + window.scrollX, y: box.top + window.scrollY, w: box.width, h: box.height }
}

/** The window's content box: its border box less its borders (it has no padding). */
function contentRect(element: HTMLElement): DOMRect {
  const box = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  const left = px(style.borderLeftWidth) + px(style.paddingLeft)
  const top = px(style.borderTopWidth) + px(style.paddingTop)
  const right = px(style.borderRightWidth) + px(style.paddingRight)
  const bottom = px(style.borderBottomWidth) + px(style.paddingBottom)
  return new DOMRect(
    box.left + left,
    box.top + top,
    box.width - left - right,
    box.height - top - bottom,
  )
}

let host: HTMLDivElement
let root: Root
let stores: AppStores
let urls: string[] = []

beforeEach(async () => {
  const mounted = await mountSignedInRoot()
  host = mounted.host
  root = mounted.root
  stores = mounted.stores
})

afterEach(async () => {
  await unmountSignedInRoot({ host, root, stores })
  for (const url of urls) URL.revokeObjectURL(url)
  urls = []
})

describe('frames fit the meme snug', () => {
  it('sizes every marketplace frame to its image, edge to edge, with no backdrop', async () => {
    const memes = await feedWithoutDims()
    urls = memes.map((meme) => meme.imageUrl)
    const natural = new Map(memes.map((meme, index) => [meme.id, SIZES[index] ?? [1, 1]]))
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) => {
        const value =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const url = new URL(value, window.location.origin)
        if (url.pathname === '/api/memes') return Response.json({ memes, nextCursor: null })
        return Response.json({ error: `unexpected ${url.pathname}` }, { status: 404 })
      }),
    )
    // wide enough for the desktop geometry: five 248px columns
    host.style.width = '1336px'

    await act(async () => {
      root.render(
        <StoresProvider stores={stores}>
          <MemoryRouter initialEntries={['/marketplace']}>
            <MarketplaceView />
          </MemoryRouter>
        </StoresProvider>,
      )
      await settle()
    })

    const cards = () => [...host.querySelectorAll<HTMLElement>('[data-slot="meme-card"]')]
    await eventually(() => {
      expect(cards()).toHaveLength(memes.length)
      expect(host.querySelector('[data-waiting]')).toBeNull()
    })
    // where each card first painted: it must not move or resize once its art has painted
    const firstPaint = cards().map(pageBox)
    for (const card of cards()) {
      card.scrollIntoView({ block: 'center' })
      await tick()
    }
    window.scrollTo(0, 0)
    await tick()

    expect(document.querySelectorAll('[data-slot="meme-art-backdrop"]')).toHaveLength(0)
    const slots = [...host.querySelectorAll<HTMLElement>('[data-slot="masonry-item"]')]
    expect(slots).toHaveLength(memes.length)
    for (const [index, slot] of slots.entries()) {
      const card = slot.querySelector<HTMLElement>('[data-slot="meme-card"]')
      const frame = card?.querySelector<HTMLElement>('[data-slot="collectible-window"]')
      const art = card?.querySelector<HTMLImageElement>('[data-slot="meme-art"]')
      if (!card || !frame || !art) throw new Error(`slot ${index} has no card, window or art`)
      const [width, height] = natural.get(memes[index]?.id ?? '') ?? [1, 1]
      // the rendered image is the drawn one, not a stand-in
      expect(art.src).toBe(memes[index]?.imageUrl)

      // A. the window takes the art's ratio, clamped, within 1%
      const inner = contentRect(frame)
      const expected = Math.min(MEME_ASPECT_MAX, Math.max(MEME_ASPECT_MIN, width / height))
      expect(Math.abs(inner.width / inner.height / expected - 1)).toBeLessThanOrEqual(0.01)

      // B. the art is the window's content box, within a pixel on every side
      const drawn = art.getBoundingClientRect()
      expect(Math.abs(drawn.left - inner.left)).toBeLessThanOrEqual(1)
      expect(Math.abs(drawn.top - inner.top)).toBeLessThanOrEqual(1)
      expect(Math.abs(drawn.right - inner.right)).toBeLessThanOrEqual(1)
      expect(Math.abs(drawn.bottom - inner.bottom)).toBeLessThanOrEqual(1)
      expect(getComputedStyle(art).objectFit).toBe('cover')

      // D. the card is its masonry slot, within a pixel
      const box = getComputedStyle(slot)
      expect(Math.abs(card.offsetWidth - px(box.width))).toBeLessThanOrEqual(1)
      expect(Math.abs(card.offsetHeight - px(box.height))).toBeLessThanOrEqual(1)

      // F. and it has not moved since it first painted
      expect(pageBox(card)).toEqual(firstPaint[index])
    }

    // feed order is DOM order
    expect(
      cards().map((card) => card.querySelector('[data-slot="meme-title"]')?.textContent),
    ).toEqual(memes.map((meme) => meme.title))
  })
})
