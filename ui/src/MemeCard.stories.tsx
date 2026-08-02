import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemeCard } from './MemeCard'
import { BINDER, LADDER, meme, TIERS, art } from './fixtures'

const meta = {
  title: 'Cards/MemeCard',
  component: MemeCard,
  parameters: {
    docs: {
      description: {
        component:
          'The trading-card tile. Has no intrinsic width — always render it inside `card-grid` or another width-constrained parent.',
      },
    },
  },
} satisfies Meta<typeof MemeCard>

export default meta
type Story = StoryObj<typeof meta>

/** The standard grid card: art, title, tier chip, and the stat line. */
export const Default: Story = {
  args: { meme: meme() },
  decorators: [(S) => <div style={{ width: 260 }}><S /></div>],
}

/** Tier drives the frame, sheen and sparkle treatments — the primary variant axis. */
export const TierLadder: Story = {
  args: { meme: meme() },
  render: () => (
    <div className="card-grid">
      {LADDER.map((m) => (
        <MemeCard key={m.id} meme={m} />
      ))}
    </div>
  ),
}

/** A meme with an open listing shows the “for sale” badge and its per-share ask. */
export const ForSale: Story = {
  args: {
    meme: meme({
      title: 'selling shares of my own cringe',
      listing: { sellerId: 'u_1', pricePerShare: 96, shares: 12 },
      imageUrl: art('#1e3a4d', '#7fd4ff', '💸'),
    }),
  },
  decorators: [(S) => <div style={{ width: 260 }}><S /></div>],
}

/** The `footer` slot appends owner actions under the stat line. */
export const WithFooter: Story = {
  args: {
    meme: BINDER[0],
    footer: (
      <span className="meme-sub">
        <span>you own 24 sh</span>
        <button className="primary">Sell</button>
      </span>
    ),
  },
  decorators: [(S) => <div style={{ width: 260 }}><S /></div>],
}

/** Video memes autoplay muted, using `imageUrl` as the poster. */
export const VideoMeme: Story = {
  args: {
    meme: meme({
      mediaType: 'video',
      videoUrl: '',
      title: 'it loops forever and so do i',
      tier: TIERS.chrome,
      tierKey: 'chrome',
      imageUrl: art('#4a5480', '#b8c6ff', '🎬'),
    }),
  },
  decorators: [(S) => <div style={{ width: 260 }}><S /></div>],
}
