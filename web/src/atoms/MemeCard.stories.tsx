import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, within } from 'storybook/test'
import { memeValue, TIERS, tierFor } from '../../../shared/tiers'
import { holoMeme, listedHolo, paperMeme, silverMeme } from '../../.storybook/fixtures'
import type { Meme } from '../lib/types'
import { buildMemeCardModel, buildReducedMotionMemeCardModel } from '../lib/memeCardModel'
import { MemeCard } from './MemeCard'

/** Story-local fixtures: the shared bag carries four tiers, this file needs all seven and the video branch. */
function localMeme(partial: Pick<Meme, 'id' | 'title' | 'reshares'> & Partial<Meme>): Meme {
  const tier = tierFor(partial.reshares)
  return {
    description: null,
    mediaType: 'image',
    imageUrl: '/brand/og-home.png',
    videoUrl: null,
    tags: [],
    creatorId: 'user-lou',
    creatorName: 'lou',
    ownerId: 'user-lou',
    ownerName: 'lou',
    listing: null,
    createdAt: '2026-09-08T00:00:00.000Z',
    tier,
    tierKey: tier.key,
    value: memeValue(partial.reshares),
    views: partial.reshares * 12,
    reshareCount: partial.reshares,
    remixOf: null,
    private: false,
    source: null,
    ...partial,
  }
}

const chromeMeme = localMeme({ id: 'meme-chrome', title: 'chrome streak', reshares: 250 })
const goldMeme = localMeme({ id: 'meme-gold', title: 'gold standard', reshares: 1000 })
const prismaticMeme = localMeme({ id: 'meme-prismatic', title: 'prismatic run', reshares: 5000 })
const shinyMeme = localMeme({ id: 'meme-shiny', title: 'shiny legend', reshares: 41_000 })

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

const videoLoop = localMeme({
  id: 'meme-video',
  title: 'looping bit',
  reshares: 60,
  mediaType: 'video',
  videoUrl: '/promo/memeon-promo.mp4',
  imageUrl: '/promo/memeon-promo-poster.jpg',
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
    (Story) => (
      <MemoryRouter>
        <div style={{ maxWidth: 280 }}>
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
    await expect(card).toHaveTextContent('reshares')
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
    // compact on screen, spelled out for a screen reader at a purchase decision
    await expect(canvas.getByText('10 sh @ 🧠3')).toBeVisible()
    await expect(canvas.getByText('10 shares at 3 braincells each')).toBeInTheDocument()
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
  args: { model: buildMemeCardModel(videoLoop) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('button', { name: `Play ${videoLoop.title}` })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  },
}

/** the OS asked for stillness: the poster is the whole card until the player presses play */
export const VideoReducedMotion: Story = {
  args: { model: buildReducedMotionMemeCardModel(videoLoop) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('article').dataset.mediaAutoplay).toBe('off')
    await expect(canvas.getByRole('button', { name: `Play ${videoLoop.title}` })).toBeVisible()
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
