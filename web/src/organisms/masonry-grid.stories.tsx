import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect } from 'storybook/test'
import {
  chromeMeme,
  goldMeme,
  holoMeme,
  listedHolo,
  masonryModelAt,
  paperMeme,
  silverMeme,
} from '../../.storybook/fixtures'
import type { Meme } from '../lib/types'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { MemeCard } from '@/molecules/meme-card'
import { MasonryGrid } from '@/organisms/masonry-grid'

const withDims = (meme: Meme, id: string, width: number, height: number): Meme => ({
  ...meme,
  id,
  width,
  height,
})

/** A feed the way dev serves one: wide, tall, square, clamped and legacy no-dims records mixed. */
const feed: Meme[] = [
  withDims(holoMeme, 'ms-wide', 480, 270),
  withDims(silverMeme, 'ms-tall', 320, 568),
  { ...paperMeme, id: 'ms-legacy' },
  withDims(listedHolo, 'ms-square', 640, 640),
  withDims(goldMeme, 'ms-clamped', 900, 200),
  withDims(chromeMeme, 'ms-portrait', 480, 600),
  withDims(holoMeme, 'ms-wide-2', 500, 280),
  withDims(silverMeme, 'ms-tall-2', 400, 700),
]

const cards = feed.map(buildMemeCardModel)
const items = cards.map((card) => ({ id: card.id, aspect: card.aspect }))

const gridAt = (width: number) => (
  <div style={{ width }}>
    <MasonryGrid
      model={masonryModelAt(width, items)}
      items={cards.map((card) => ({ node: <MemeCard model={card} /> }))}
    />
  </div>
)

const meta = {
  title: 'Organisms/MasonryGrid',
  component: MasonryGrid,
  decorators: [(Story) => <MemoryRouter>{Story()}</MemoryRouter>],
} satisfies Meta<typeof MasonryGrid>

export default meta
type Story = StoryObj<typeof meta>

const baseArgs = {
  model: masonryModelAt(1024, items),
  items: cards.map((card) => ({ node: <MemeCard model={card} /> })),
}

/** Five fixed 248px columns; slots sit in DOM feed order, not column order. */
export const At1440: Story = {
  args: baseArgs,
  render: () => gridAt(1440),
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector('[role="list"]')!
    const slots = [...list.querySelectorAll<HTMLElement>('[role="listitem"]')]
    await expect(slots).toHaveLength(feed.length)
    // DOM order is feed order: the first slot holds the first feed card
    await expect(slots[0]!.querySelector('[data-slot="meme-title"]')!.textContent).toBe(
      feed[0]!.title,
    )
    // floor((1440 + 16) / 264) = 5 columns → a 5 × 248 + 4 × 16 = 1304 canvas, centred
    const canvas = canvasElement.querySelector<HTMLElement>('[data-slot="masonry-canvas"]')!
    await expect(canvas.getBoundingClientRect().width).toBe(5 * 248 + 4 * 16)
    // no slot reaches outside the canvas horizontally
    const canvasBox = canvas.getBoundingClientRect()
    for (const slot of slots) {
      const box = slot.getBoundingClientRect()
      await expect(box.left).toBeGreaterThanOrEqual(canvasBox.left - 31)
      await expect(box.right).toBeLessThanOrEqual(canvasBox.right + 31)
    }
  },
}

export const At1024: Story = { args: baseArgs, render: () => gridAt(1024) }

export const At768: Story = { args: baseArgs, render: () => gridAt(768) }

/** Below 640: two fluid columns with a 12px gap, edge to edge. */
export const At390: Story = {
  args: baseArgs,
  render: () => gridAt(390),
  play: async ({ canvasElement }) => {
    const canvas = canvasElement.querySelector<HTMLElement>('[data-slot="masonry-canvas"]')!
    await expect(Math.round(canvas.getBoundingClientRect().width)).toBe(390)
  },
}
