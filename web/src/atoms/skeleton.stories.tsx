import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Skeleton, SkeletonBlock, SkeletonCard, SkeletonRow } from '@/atoms/skeleton'

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: { style: { width: 120, height: 40 } },
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector('[data-slot="skeleton"]')
    await expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    await expect(skeleton).toHaveAttribute('data-variant', 'default')
  },
}

/** Reserves the same 340px a card slot reserves at any track width. */
export const Card: Story = {
  render: () => <SkeletonCard style={{ width: 170 }} />,
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="skeleton-card"]')!
    await expect(card).toHaveAttribute('data-variant', 'card')
    await expect(card.offsetHeight).toBe(240)
  },
}

export const Row: Story = {
  render: () => <SkeletonRow style={{ width: 320 }} />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="skeleton-row"]')).toHaveAttribute(
      'data-variant',
      'row',
    )
  },
}

export const Block: Story = {
  render: () => <SkeletonBlock style={{ width: 180 }} />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="skeleton-block"]')).toHaveAttribute(
      'data-variant',
      'block',
    )
  },
}

/** The same shapes through the one root and its `variant` axis. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, width: 320 }}>
      <Skeleton variant="block" style={{ width: 180 }} />
      <Skeleton variant="row" />
      <Skeleton variant="card" style={{ width: 170 }} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const variants = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')].map(
      (node) => node.dataset.variant,
    )
    await expect(variants).toEqual(['block', 'row', 'card'])
  },
}

export const Dark: Story = { ...Card, globals: { theme: 'dark' } }
