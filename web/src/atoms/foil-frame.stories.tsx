import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { FoilCard, FoilMedia } from '@/atoms/foil-frame'

function Specimen({
  tierKey,
  rarityLadder,
  as,
  presentation,
}: {
  tierKey: string
  rarityLadder?: boolean | undefined
  as?: 'div' | 'li' | 'article' | undefined
  presentation?: 'default' | 'collectible' | undefined
}) {
  return (
    <FoilCard
      as={as}
      tierKey={tierKey}
      rarityLadder={rarityLadder}
      presentation={presentation}
      className={presentation === 'collectible' ? 'w-40' : 'w-40 rounded-lg material-card p-2'}
    >
      <FoilMedia
        presentation={presentation}
        className={presentation === 'collectible' ? 'block' : 'block overflow-hidden'}
      >
        <span className="block aspect-4/3 w-full bg-muted" />
      </FoilMedia>
    </FoilCard>
  )
}

const hostOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('.foil-card')!

const meta = {
  title: 'Atoms/FoilFrame',
  component: FoilCard,
  args: { tierKey: 'paper', children: null },
} satisfies Meta<typeof FoilCard>

export default meta
type Story = StoryObj<typeof meta>

/** Paper is still: no sheen, no sparkle. */
export const Paper: Story = {
  render: () => <Specimen tierKey="paper" />,
  play: async ({ canvasElement }) => {
    const host = hostOf(canvasElement)
    await expect(host.tagName).toBe('DIV')
    await expect(host).toHaveClass('foil-card', 'tier-paper')
    await expect(host).not.toHaveClass('sheen')
    await expect(host).not.toHaveClass('sparkle')
    await expect(host).not.toHaveClass('tier-card')
    await expect(host).not.toHaveAttribute('rarityladder')
    const media = host.querySelector('[data-slot="foil-media"]')
    await expect(media).toHaveClass(
      'foil-frame',
      'foil-media',
      'relative',
      'rounded-md',
      'bg-muted',
    )
  },
}

/** One sheen tier (holo): no sparkle. */
export const Sheen: Story = {
  render: () => <Specimen tierKey="holo" />,
  play: async ({ canvasElement }) => {
    const host = hostOf(canvasElement)
    await expect(host).toHaveClass('foil-card', 'tier-holo', 'sheen')
    await expect(host).not.toHaveClass('sparkle')
  },
}

/** Shiny is sheen plus sparkle. */
export const Sparkle: Story = {
  render: () => <Specimen tierKey="shiny" />,
  play: async ({ canvasElement }) => {
    const host = hostOf(canvasElement)
    await expect(host).toHaveClass('foil-card', 'tier-shiny', 'sheen', 'sparkle')
  },
}

/** Landing ladder host: class `tier-card`, never a DOM boolean. */
export const RarityLadder: Story = {
  render: () => (
    <ol className="m-0 list-none p-0">
      <Specimen as="li" tierKey="gold" rarityLadder />
    </ol>
  ),
  play: async ({ canvasElement }) => {
    const host = hostOf(canvasElement)
    await expect(host.tagName).toBe('LI')
    await expect(host).toHaveClass('foil-card', 'tier-gold', 'sheen', 'tier-card')
    await expect(host).not.toHaveAttribute('rarityladder')
  },
}

/** The broad physical shell is opt-in; landing and creation callers keep the compact frame. */
export const Collectible: Story = {
  render: () => <Specimen tierKey="shiny" presentation="collectible" />,
  play: async ({ canvasElement }) => {
    const host = hostOf(canvasElement)
    await expect(host).toHaveAttribute('data-presentation', 'collectible')
    await expect(host.querySelector('[data-slot="collectible-backing"]')).not.toBeNull()
    await expect(host.querySelector('[data-slot="collectible-rail"]')).not.toBeNull()
    await expect(host.querySelector('[data-slot="collectible-window"]')).not.toBeNull()
  },
}

export const Dark: Story = { ...Paper, globals: { theme: 'dark' } }
