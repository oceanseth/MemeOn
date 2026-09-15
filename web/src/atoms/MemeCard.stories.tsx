import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, within } from 'storybook/test'
import { memeValue, tierFor, TIERS } from '@memeon/shared/tiers'
import {
  chromeMeme,
  goldMeme,
  holoMeme,
  listedHolo,
  paperMeme,
  prismaticMeme,
  shinyMeme,
  silverMeme,
  videoMeme,
} from '../../.storybook/fixtures'
import type { Meme } from '../lib/types'
import { memeCardCopy as copy } from '../copy/memeCard'
import { buildMemeCardModel, buildReducedMotionMemeCardModel } from '../lib/memeCardModel'
import { MemeCard } from './MemeCard'

/** Story-local fixtures: tier ladder uses real dev art; ids stay stable for link assertions. */
function localMeme(partial: Pick<Meme, 'id' | 'title' | 'reshares'> & Partial<Meme>): Meme {
  const art =
    partial.reshares >= 25_000
      ? shinyMeme
      : partial.reshares >= 5_000
        ? prismaticMeme
        : partial.reshares >= 1_000
          ? goldMeme
          : partial.reshares >= 250
            ? chromeMeme
            : partial.reshares >= 50
              ? holoMeme
              : partial.reshares >= 10
                ? silverMeme
                : paperMeme
  const tier = tierFor(partial.reshares)
  return {
    description: null,
    mediaType: 'image',
    imageUrl: art.imageUrl,
    videoUrl: art.videoUrl,
    tags: [],
    creatorId: art.creatorId,
    creatorName: art.creatorName,
    ownerId: art.ownerId,
    ownerName: art.ownerName,
    listing: null,
    createdAt: '2026-09-08T00:00:00.000Z',
    tier,
    tierKey: tier.key,
    value: memeValue(partial.reshares),
    views: partial.views ?? partial.reshares * 12,
    reshareCount: partial.reshareCount ?? partial.reshares,
    remixOf: null,
    private: false,
    source: null,
    ...partial,
  }
}

/** the product caps a title at 20 characters, so the ellipsis must never fire inside that cap */
const longTitleMeme = localMeme({
  id: 'meme-long-title',
  title: 'wwwwwwwwwwwwwwwwwwww',
  reshares: 60,
})

/** a record that never carried a view count: the eye stat is dropped, not borrowed from reshares */
const noViewsMeme = localMeme({
  id: 'meme-no-views',
  title: 'quiet classic',
  reshares: 60,
  views: undefined,
  reshareCount: 60,
})

const allTiers = TIERS.map((tier, index) =>
  localMeme({
    id: `meme-tier-${tier.key}`,
    title: `${tier.name.toLowerCase()} rung`,
    reshares: tier.minReshares + index,
  }),
)

const meta = {
  title: 'Atoms/MemeCard',
  component: MemeCard,
  decorators: [
    /* a card is sized by its grid track: 280px is the marketplace column, and `cardWidth` lets the
       detail-hero story ask for the 420px one without moving any other story's frame */
    (Story, context) => (
      <MemoryRouter>
        <div style={{ maxWidth: (context.parameters['cardWidth'] as number | undefined) ?? 280 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MemeCard>

export default meta
type Story = StoryObj<typeof meta>

export const Paper: Story = {
  args: { model: buildMemeCardModel(paperMeme) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = canvas.getByRole('article', { name: paperMeme.title })
    await expect(canvas.getByRole('link', { name: `Open ${paperMeme.title}` })).toHaveAttribute(
      'href',
      '/m/meme-paper',
    )
    // the art is named by the card and the link, never a third time by itself
    await expect(within(card).queryByRole('img')).toBeNull()
    await expect(card.querySelector('[data-slot="meme-art"]')).toHaveStyle({ objectFit: 'contain' })
    await expect(card).toHaveTextContent('reshares')
    // the chip says the tier in product language, and nothing else on the card repeats it
    await expect(within(card).getByText('Paper')).toBeVisible()
  },
}

export const Silver: Story = { args: { model: buildMemeCardModel(silverMeme) } }
export const Holo: Story = { args: { model: buildMemeCardModel(holoMeme) } }
export const Chrome: Story = { args: { model: buildMemeCardModel(chromeMeme) } }
export const Gold: Story = { args: { model: buildMemeCardModel(goldMeme) } }
export const Prismatic: Story = { args: { model: buildMemeCardModel(prismaticMeme) } }
/** the only sparkle coverage in the app */
export const Shiny: Story = { args: { model: buildMemeCardModel(shinyMeme) } }

export const Listed: Story = {
  args: { model: buildMemeCardModel(listedHolo) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // two lines in the 64px slot on screen, one sentence (with the price) for a screen reader
    await expect(canvas.getByText(copy.shares(10))).toBeVisible()
    await expect(canvas.getByText(copy.forSale)).toBeVisible()
    await expect(canvas.getByText(copy.sharesForSaleAt(10, 3))).toBeInTheDocument()
  },
}

/** Listing state in the footer right slot, not a control. */
export const ForSale: Story = {
  ...Listed,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const slot = canvasElement.querySelector('[data-slot="for-sale"]')!
    await expect(slot).toHaveTextContent(copy.shares(10))
    await expect(slot).toHaveTextContent(copy.forSale)
    // it lives in the footer row, never over the art
    await expect(slot.closest('[data-slot="meme-sub"]')).not.toBeNull()
    // a label, never a button: nothing here is clickable
    await expect(canvas.queryByRole('button', { name: /for sale/i })).toBeNull()
  },
}

export const LongTitle: Story = { args: { model: buildMemeCardModel(longTitleMeme) } }

export const NoViews: Story = {
  args: { model: buildMemeCardModel(noViewsMeme) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText(/👁️/)).toBeNull()
    await expect(canvas.getByText('60 reshares')).toBeInTheDocument()
  },
}

/** autoplay is loaned out by the viewport observer and can always be taken back */
export const Video: Story = {
  args: { model: buildMemeCardModel(videoMeme) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('button', { name: `Play ${videoMeme.title}` })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  },
}

/** the OS asked for stillness: the poster is the whole card until the player presses play */
export const VideoReducedMotion: Story = {
  args: { model: buildReducedMotionMemeCardModel(videoMeme) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('article').dataset.mediaAutoplay).toBe('off')
    await expect(canvas.getByRole('button', { name: `Play ${videoMeme.title}` })).toBeVisible()
  },
}

export const Focused: Story = {
  args: { model: buildMemeCardModel(holoMeme) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    await expect(canvas.getByRole('link', { name: `Open ${holoMeme.title}` })).toHaveFocus()
  },
}

/**
 * The detail-page hero, the one `size="lg"` caller: the same square contain plate as the grid,
 * a 27/34 wrapping title, roomier meta, no hover lift.
 */
export const Large: Story = {
  args: { model: buildMemeCardModel(longTitleMeme), size: 'lg' },
  parameters: { cardWidth: 420 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = canvas.getByRole('article', { name: longTitleMeme.title })
    await expect(card.dataset.size).toBe('lg')
    const title = within(card).getByText(longTitleMeme.title)
    // the hero title wraps rather than ellipsizing: nothing about the meme is cropped away
    await expect(card.querySelector('[data-slot="meme-art"]')).toHaveStyle({ objectFit: 'contain' })
    await expect(title).toHaveStyle({ whiteSpace: 'normal' })
    await expect(title).toHaveStyle({ fontSize: '27px', lineHeight: '34px' })
  },
}

/**
 * The detail hero as `MemeDetailScreen` renders it: square contained art, the 13px tier chip, the
 * listing state in the footer's right slot. Same atom, one prop apart from a grid thumb.
 */
export const Hero: Story = {
  args: { model: buildMemeCardModel(listedHolo), size: 'lg' },
  parameters: { cardWidth: 420 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = canvas.getByRole('article', { name: listedHolo.title })
    await expect(card.dataset.size).toBe('lg')
    await expect(within(card).getByText('Holo')).toBeVisible()
    await expect(within(card).getByText('for sale')).toBeVisible()
  },
}

/** The 390px card: 166 wide, square art, the phone title size. */
export const Phone: Story = {
  args: { model: buildMemeCardModel(holoMeme) },
  parameters: {
    cardWidth: 166,
    viewport: {
      options: { phone: { name: 'iPhone 14', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone', isRotated: false } },
}

/** the whole rarity ladder in one frame — the cheapest guard against two rungs collapsing into one */
export const AllTiers: Story = {
  args: { model: buildMemeCardModel(allTiers[0] as Meme) },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 'min(1180px, calc(100vw - 32px))',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          alignItems: 'start',
          gap: 20,
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      {allTiers.map((tierMeme) => (
        <MemeCard key={tierMeme.id} model={buildMemeCardModel(tierMeme)} />
      ))}
    </>
  ),
}

/** The same ladder on the dark arm: seven frames and seven chips that still read as seven tiers. */
export const Dark: Story = { ...AllTiers, globals: { theme: 'dark' } }
