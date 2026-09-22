import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Badge } from '@/atoms/badge'

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  args: { children: 'new' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('[data-slot="badge"]')
    await expect(badge).not.toBeNull()
    await expect(badge).toHaveAttribute('data-variant', 'default')
  },
}

export const Info: Story = { args: { variant: 'info', children: 'Friends' } }

/** The six variants, in the order a screen reaches for them. */
export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        padding: 16,
      }}
    >
      <Badge>12 held</Badge>
      <Badge variant="primary">For sale</Badge>
      <Badge variant="success">Minted</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="error">Failed</Badge>
      <Badge variant="info">Friends</Badge>
      <Badge>private</Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-slot="badge"]')).toHaveLength(7)
  },
}

/** `render` swaps the span for a link, so a status pill can be the way to the thing it names. */
export const AsLink: Story = {
  render: () => (
    <Badge variant="primary" render={<a href="/marketplace" />}>
      For sale
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: 'For sale' })
    await expect(link).toHaveAttribute('data-slot', 'badge')
    await expect(link).toHaveAttribute('data-variant', 'primary')
  },
}

/** The unread bubble: the strong destructive pair on a 16px disc. */
export const Count: Story = {
  render: () => (
    <Badge variant="destructive" size="count">
      7
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector<HTMLElement>('[data-slot="badge"]')!
    await expect(badge).toHaveAttribute('data-variant', 'destructive')
    await expect(badge.offsetHeight).toBe(16)
  },
}

export const Dark: Story = { ...Variants, globals: { theme: 'dark' } }
