import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import '@/index.css'
import { MemeCard } from '@/molecules/meme-card'
import type { MasonryGridModel } from '../hooks/useMasonryLayout'
import { layoutMasonry, masonryGeometry, MEME_CARD_META_HEIGHT } from '../lib/masonry'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { listedHolo, paperMeme } from '../test/fixtures'
import { MasonryGrid } from './masonry-grid'

/* titles the marketplace really carries: longer than a column at either geometry */
const LONG_TITLE = 'Hacking Work From Home While The Whole Office Watches'

const memes = [
  { ...paperMeme, id: 'long-paper', title: LONG_TITLE },
  { ...listedHolo, id: 'long-listed', title: LONG_TITLE, width: 800, height: 1200 },
  { ...paperMeme, id: 'short-paper' },
]

function modelAt(containerWidth: number, aspects: readonly number[]): MasonryGridModel {
  const geometry = masonryGeometry(containerWidth)
  const layout = layoutMasonry({ aspects, ...geometry, chromeHeight: MEME_CARD_META_HEIGHT })
  return {
    containerRef: () => {},
    canvasWidth: geometry.columns * geometry.columnWidth + (geometry.columns - 1) * geometry.gap,
    height: layout.height,
    slots: layout.items.map((item, index) => ({
      key: memes[index]?.id ?? String(index),
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    })),
  }
}

let host: HTMLDivElement | undefined
let root: Root | undefined

async function mount(containerWidth: number): Promise<HTMLElement[]> {
  const cards = memes.map((meme) => buildMemeCardModel(meme))
  host = document.createElement('div')
  host.style.width = `${containerWidth}px`
  document.body.append(host)
  root = createRoot(host)
  await act(() => {
    root?.render(
      <MemoryRouter>
        <MasonryGrid
          model={modelAt(
            containerWidth,
            cards.map((card) => card.aspect),
          )}
          items={cards.map((card) => ({ node: <MemeCard model={card} /> }))}
        />
      </MemoryRouter>,
    )
  })
  return [...host.querySelectorAll<HTMLElement>('[data-slot="masonry-item"]')]
}

afterEach(async () => {
  await act(() => {
    root?.unmount()
  })
  host?.remove()
  root = undefined
  host = undefined
})

describe('MasonryGrid slots', () => {
  it.each([
    ['desktop columns', 1336],
    ['phone columns', 350],
  ])('hold every card to the slot the layout gave it (%s)', async (_name, containerWidth) => {
    const slots = await mount(containerWidth)
    expect(slots).toHaveLength(memes.length)
    for (const slot of slots) {
      const card = slot.querySelector<HTMLElement>('[data-slot="meme-card"]')
      if (!card) throw new Error('slot without a card')
      // offset sizes are whole pixels and a phone column is not: a pixel of slack
      const box = getComputedStyle(slot)
      expect(Math.abs(card.offsetWidth - Number.parseFloat(box.width))).toBeLessThanOrEqual(1)
      expect(Math.abs(card.offsetHeight - Number.parseFloat(box.height))).toBeLessThanOrEqual(1)
    }
  })
})
