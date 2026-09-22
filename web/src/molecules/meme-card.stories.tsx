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
import { MemeCard } from '@/molecules/meme-card'
import { SkeletonCard } from '@/atoms/skeleton'

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
    views: partial.reshares,
    reshareCount: 0,
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
  reshareCount: 60,
})
delete noViewsMeme.views

const artFixture = (width: number, height: number, caption: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
      `<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#7028e4"/><stop offset="1" stop-color="#19c9d7"/></linearGradient></defs>` +
      `<rect width="${width}" height="${height}" fill="url(#g)"/>` +
      `<circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 4}" fill="#ffd84d"/>` +
      `<rect y="${height * 0.76}" width="${width}" height="${height * 0.24}" fill="#fff"/>` +
      `<text x="${width / 2}" y="${height * 0.9}" text-anchor="middle" fill="#171421" font-family="system-ui" font-weight="700" font-size="${Math.max(16, Math.min(width, height) / 12)}">${caption}</text>` +
      '</svg>',
  )}`

const mediaShapes = [
  localMeme({
    id: 'meme-square-art',
    title: 'square art',
    reshares: 1,
    imageUrl: artFixture(400, 400, 'SQUARE'),
  }),
  localMeme({
    id: 'meme-wide-art',
    title: 'wide art',
    reshares: 12,
    imageUrl: artFixture(640, 300, 'WIDE CAPTION'),
  }),
  localMeme({
    id: 'meme-tall-art',
    title: 'tall art',
    reshares: 60,
    imageUrl: artFixture(320, 640, 'TALL'),
  }),
  localMeme({
    id: 'meme-caption-art',
    title: 'caption intact',
    reshares: 400,
    imageUrl: artFixture(640, 360, 'BOTTOM TEXT STAYS'),
  }),
] as const

const apertureMeme = localMeme({
  id: 'meme-aperture-art',
  title: 'corner captions',
  reshares: 60,
  imageUrl: `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">' +
      '<rect width="300" height="400" fill="#34205d"/>' +
      '<rect x="1" y="1" width="18" height="18" fill="#fff"/>' +
      '<rect x="281" y="1" width="18" height="18" fill="#ffdc49"/>' +
      '<rect x="1" y="381" width="18" height="18" fill="#4ee4ff"/>' +
      '<rect x="281" y="381" width="18" height="18" fill="#ff5bbd"/>' +
      '<text x="150" y="210" text-anchor="middle" fill="#fff" font-family="system-ui" font-size="24">ALL FOUR CORNERS</text>' +
      '</svg>',
  )}`,
})

const allTiers = TIERS.map((tier, index) =>
  localMeme({
    id: `meme-tier-${tier.key}`,
    title: `${tier.name.toLowerCase()} rung`,
    reshares: tier.minReshares + index,
  }),
)

const meta = {
  title: 'Molecules/MemeCard',
  component: MemeCard,
  decorators: [
    /* a card is sized by its grid track: 280px is the marketplace column, and `cardWidth` lets the
       detail-hero story ask for the 420px one without moving any other story's frame */
    (Story, context) => (
      <MemoryRouter>
        <div
          style={{
            maxWidth: (context.parameters['cardWidth'] as number | undefined) ?? 280,
          }}
        >
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
    // the art is named by the card and link; the only image role is the tier's corner seal
    await expect(
      within(card).getByRole('img', {
        name: `${paperMeme.tier.name} · ${paperMeme.tier.rarity}`,
      }),
    ).toBeVisible()
    await expect(card.querySelector('[data-slot="meme-art-backdrop"]')).toHaveAttribute(
      'loading',
      'lazy',
    )
    await expect(card.querySelector('[data-slot="meme-art"]')).toHaveStyle({
      objectFit: 'contain',
    })
    await expect(card).toHaveTextContent('reshares')
    // the chip says the tier in product language, and nothing else on the card repeats it
    await expect(within(card).getByText('Paper')).toBeVisible()
  },
}

export const Silver: Story = { args: { model: buildMemeCardModel(silverMeme) } }
export const Holo: Story = { args: { model: buildMemeCardModel(holoMeme) } }
export const Chrome: Story = { args: { model: buildMemeCardModel(chromeMeme) } }
export const Gold: Story = { args: { model: buildMemeCardModel(goldMeme) } }
export const Prismatic: Story = {
  args: { model: buildMemeCardModel(prismaticMeme) },
}
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

export const LongTitle: Story = {
  args: { model: buildMemeCardModel(longTitleMeme) },
}

export const NoViews: Story = {
  args: { model: buildMemeCardModel(noViewsMeme) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText(/views/)).toBeNull()
    await expect(canvas.getByText('60 reshares')).toBeInTheDocument()
  },
}

/** autoplay is loaned out by the viewport observer; Play videos in the account menu is the control */
export const Video: Story = {
  args: { model: buildMemeCardModel(videoMeme) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('article').querySelector('video')).not.toBeNull()
    await expect(canvas.queryByRole('button', { name: /Play / })).toBeNull()
  },
}

/** the OS asked for stillness: the poster is the whole card and Play videos stays off */
export const VideoReducedMotion: Story = {
  args: { model: buildReducedMotionMemeCardModel(videoMeme) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('article').dataset.mediaAutoplay).toBe('off')
    await expect(canvas.queryByRole('button', { name: /Play / })).toBeNull()
  },
}

/** Square, wide, tall and caption-heavy sources share a stage without cropping the foreground. */
export const MediaShapes: Story = {
  args: { model: buildMemeCardModel(mediaShapes[0]) },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 'min(1000px, calc(100vw - 32px))',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 20,
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      {mediaShapes.map((meme) => (
        <MemeCard key={meme.id} model={buildMemeCardModel(meme)} />
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="meme-card"]')]
    await expect(cards).toHaveLength(4)
    for (const card of cards) {
      await expect(card.querySelector('[data-slot="meme-art"]')).toHaveStyle({
        objectFit: 'contain',
      })
      await expect(card.querySelector('[data-slot="meme-art-backdrop"]')).toHaveAttribute(
        'aria-hidden',
        'true',
      )
    }
  },
}

/** A 3:4 source that fills the aperture keeps all four source corners inside the rounded mask. */
export const ApertureCorners: Story = {
  args: { model: buildMemeCardModel(apertureMeme) },
  play: async ({ canvasElement }) => {
    const art = canvasElement.querySelector<HTMLElement>('[data-slot="meme-art"]')!
    const window = canvasElement.querySelector<HTMLElement>('[data-slot="collectible-window"]')!
    const artBox = art.getBoundingClientRect()
    const windowBox = window.getBoundingClientRect()
    await expect(Math.round(artBox.left - windowBox.left)).toBeGreaterThanOrEqual(8)
    await expect(Math.round(artBox.top - windowBox.top)).toBeGreaterThanOrEqual(8)
    await expect(Math.round(windowBox.right - artBox.right)).toBeGreaterThanOrEqual(8)
    await expect(Math.round(windowBox.bottom - artBox.bottom)).toBeGreaterThanOrEqual(8)
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
 * a wrapping title at the `3xl` step, roomier meta, no hover lift.
 */
export const Large: Story = {
  args: { model: buildMemeCardModel(longTitleMeme), size: 'lg', titleAs: 'h1' },
  parameters: { cardWidth: 420 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = canvas.getByRole('article', { name: longTitleMeme.title })
    await expect(card.dataset.size).toBe('lg')
    const title = within(card).getByRole('heading', {
      level: 1,
      name: longTitleMeme.title,
    })
    // the hero title wraps rather than ellipsizing: nothing about the meme is cropped away
    await expect(card.querySelector('[data-slot="meme-art"]')).toHaveStyle({
      objectFit: 'contain',
    })
    await expect(title).toHaveStyle({ whiteSpace: 'normal' })
    const root = getComputedStyle(document.documentElement)
    await expect(title).toHaveStyle({
      fontSize: root.getPropertyValue('--text-3xl').trim(),
      lineHeight: root.getPropertyValue('--text-3xl--line-height').trim(),
    })
  },
}

/**
 * The detail hero as `MemeDetailScreen` renders it: square contained art, the 13px tier chip, the
 * listing state in the footer's right slot. Same molecule, one prop apart from a grid thumb.
 */
export const Hero: Story = {
  args: { model: buildMemeCardModel(listedHolo), size: 'lg', titleAs: 'h1' },
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
      options: {
        phone: {
          name: 'iPhone 14',
          styles: { width: '390px', height: '844px' },
        },
      },
    },
  },
  globals: { viewport: { value: 'phone', isRotated: false } },
}

/** High-tier five-digit metrics stack below the tier name on a 166px phone card. */
export const PhoneHighCounts: Story = {
  args: { model: buildMemeCardModel(prismaticMeme) },
  parameters: {
    cardWidth: 350,
    viewport: {
      options: {
        phone: {
          name: 'iPhone 14',
          styles: { width: '390px', height: '844px' },
        },
      },
    },
  },
  globals: { viewport: { value: 'phone', isRotated: false } },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 166px)',
        alignItems: 'start',
        gap: 18,
      }}
    >
      {[prismaticMeme, shinyMeme].map((meme) => (
        <MemeCard key={meme.id} model={buildMemeCardModel(meme)} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="meme-card"]')]
    await expect(cards).toHaveLength(2)
    for (const card of cards) {
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth)
      const kicker = card.querySelector<HTMLElement>('[data-slot="meme-kicker"]')!
      await expect(getComputedStyle(kicker).flexDirection).toBe('column')
    }
  },
}

/** Loading and loaded phone cards reserve the same row height. */
export const PhoneSkeletonParity: Story = {
  ...PhoneHighCounts,
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 166px)',
        alignItems: 'start',
        gap: 18,
      }}
    >
      <MemeCard model={buildMemeCardModel(prismaticMeme)} />
      <SkeletonCard />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="meme-card"]')!
    const skeleton = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton-card"]')!
    await expect(Math.abs(card.offsetHeight - skeleton.offsetHeight)).toBeLessThanOrEqual(1)
  },
}

/** Card-width containment switches the skeleton at 220px, independent of the viewport. */
export const SkeletonParity: Story = {
  args: { model: buildMemeCardModel(prismaticMeme) },
  parameters: { cardWidth: 1200 },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'start', gap: 24 }}>
      {[166, 216, 230, 280].map((width) => (
        <div
          key={width}
          data-slot="skeleton-parity-pair"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(2, ${width}px)`,
            alignItems: 'start',
            gap: 18,
          }}
        >
          <MemeCard model={buildMemeCardModel(prismaticMeme)} />
          <SkeletonCard />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const pairs = [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton-parity-pair"]'),
    ]
    await expect(pairs).toHaveLength(4)
    for (const pair of pairs) {
      const card = pair.querySelector<HTMLElement>('[data-slot="meme-card"]')!
      const skeleton = pair.querySelector<HTMLElement>('[data-slot="skeleton-card"]')!
      await expect(Math.abs(card.offsetHeight - skeleton.offsetHeight)).toBeLessThanOrEqual(1)
    }
  },
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

/**
 * Four neighbours whose content differs in every way a grid meets — a one-line and a two-line
 * title, a listing and none, an eye stat and none — on the market track. Every card is one size,
 * and the value row lands at the same height in each: the title and the listing slot reserve
 * their lines, and the track stretches whatever is left.
 */
export const Uniform: Story = {
  args: { model: buildMemeCardModel(paperMeme) },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 'min(1180px, calc(100vw - 32px))',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 20,
        }}
      >
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      {[paperMeme, longTitleMeme, listedHolo, noViewsMeme].map((meme) => (
        <MemeCard key={meme.id} model={buildMemeCardModel(meme)} />
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="meme-card"]')]
    await expect(cards).toHaveLength(4)
    const boxes = cards.map((card) => card.getBoundingClientRect())
    const first = boxes[0]!
    // the two-line title really did wrap: the long one is taller than the reserve would be alone
    const titles = cards.map(
      (card) => card.querySelector('[data-slot="meme-title"]')!.getBoundingClientRect().height,
    )
    await expect(Math.max(...titles)).toBe(Math.min(...titles))
    for (const box of boxes) {
      await expect(Math.round(box.width)).toBe(Math.round(first.width))
      await expect(Math.round(box.height)).toBe(Math.round(first.height))
    }
    // the value row sits at one offset in every card, listing or not
    const subTops = cards.map((card, index) => {
      const sub = card.querySelector('[data-slot="meme-sub"]')!.getBoundingClientRect()
      return Math.round(sub.top - boxes[index]!.top)
    })
    await expect(new Set(subTops).size).toBe(1)
    const subHeights = cards.map(
      (card) => card.querySelector('[data-slot="meme-sub"]')!.getBoundingClientRect().height,
    )
    await expect(Math.max(...subHeights)).toBe(Math.min(...subHeights))
  },
}
