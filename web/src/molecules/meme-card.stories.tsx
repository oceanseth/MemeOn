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
    // one short badge on screen, one sentence (with the price) for a screen reader
    await expect(canvas.getByText(copy.forSaleBadge(10))).toBeVisible()
    await expect(canvas.getByText(copy.sharesForSaleAt(10, 3))).toBeInTheDocument()
  },
}

/** Listing state as the meta row's right badge, not a control. */
export const ForSale: Story = {
  ...Listed,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const slot = canvasElement.querySelector('[data-slot="for-sale"]')!
    await expect(slot).toHaveTextContent(copy.forSaleBadge(10))
    // it lives in the meta row, never over the art
    await expect(slot.closest('[data-slot="meme-kicker"]')).not.toBeNull()
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
    await expect(within(card).getByText(copy.forSaleBadge(10))).toBeVisible()
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

/* ---- fitted frames: the window takes the meme's clamped ratio (masonry retired Uniform) ---- */

const squareFit = localMeme({
  id: 'meme-fit-square',
  title: 'square fill',
  reshares: 12,
  imageUrl: artFixture(400, 400, 'SQUARE'),
  width: 400,
  height: 400,
})
const tallFit = localMeme({
  id: 'meme-fit-tall',
  title: 'tall fill',
  reshares: 60,
  imageUrl: artFixture(320, 568, 'TALL'),
  width: 320,
  height: 568,
})
const wideFit = localMeme({
  id: 'meme-fit-wide',
  title: 'wide fill',
  reshares: 250,
  imageUrl: artFixture(600, 300, 'WIDE'),
  width: 600,
  height: 300,
})
const clampedFit = localMeme({
  id: 'meme-fit-clamped',
  title: 'clamped strip',
  reshares: 1000,
  imageUrl: artFixture(900, 200, 'TOO WIDE'),
  width: 900,
  height: 200,
})

/** window ratio == art ratio, drawn edge to edge with no crop and no backdrop */
const expectCoverWindow = async (canvasElement: HTMLElement, ratio: number) => {
  const card = canvasElement.querySelector<HTMLElement>('[data-slot="meme-card"]')!
  await expect(card.dataset['artFit']).toBe('cover')
  await expect(card.querySelector('[data-slot="meme-art"]')).toHaveStyle({ objectFit: 'cover' })
  await expect(card.querySelector('[data-slot="meme-art-backdrop"]')).toBeNull()
  const art = card.querySelector<HTMLElement>('[data-slot="meme-art"]')!.getBoundingClientRect()
  await expect(art.width / art.height).toBeCloseTo(ratio, 1)
}

export const SquareFill: Story = {
  args: { model: buildMemeCardModel(squareFit) },
  play: ({ canvasElement }) => expectCoverWindow(canvasElement, 1),
}

export const TallFill: Story = {
  args: { model: buildMemeCardModel(tallFit) },
  play: ({ canvasElement }) => expectCoverWindow(canvasElement, 320 / 568),
}

export const WideFill: Story = {
  args: { model: buildMemeCardModel(wideFit) },
  play: ({ canvasElement }) => expectCoverWindow(canvasElement, 2),
}

/** A 4.5:1 strip: the frame stops at the 2:1 clamp and the art falls back to contain + backdrop. */
export const ClampedStrip: Story = {
  args: { model: buildMemeCardModel(clampedFit) },
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="meme-card"]')!
    await expect(card.dataset['artFit']).toBe('contain')
    await expect(card.querySelector('[data-slot="meme-art"]')).toHaveStyle({
      objectFit: 'contain',
    })
    await expect(card.querySelector('[data-slot="meme-art-backdrop"]')).not.toBeNull()
    const link = card.querySelector<HTMLElement>('[data-slot="collectible-art-link"]')!
    const box = link.getBoundingClientRect()
    await expect(box.width / box.height).toBeCloseTo(2, 1)
  },
}

/** A record with no dims at all renders as the 1:1 legacy frame, contained over the backdrop. */
export const UnknownDims: Story = {
  args: { model: buildMemeCardModel(holoMeme) },
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="meme-card"]')!
    await expect(card.dataset['artFit']).toBe('contain')
    const link = card.querySelector<HTMLElement>('[data-slot="collectible-art-link"]')!
    const box = link.getBoundingClientRect()
    await expect(box.width / box.height).toBeCloseTo(1, 1)
  },
}
