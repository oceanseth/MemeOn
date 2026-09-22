import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Link } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { InlineLink } from '@/atoms/inline-link'

const meta = {
  title: 'Atoms/InlineLink',
  component: InlineLink,
  args: { href: '#', children: 'the leaderboard' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <p className="m-0 max-w-105 p-4 text-base text-foreground">
          Every reshare climbs <Story /> a little further.
        </p>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof InlineLink>

export default meta
type Story = StoryObj<typeof meta>

/** The ultraviolet underline every body link wears. */
export const Inline: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', {
      name: 'the leaderboard',
    })
    await expect(link).toHaveAttribute('data-slot', 'inline-link')
    await expect(link).toHaveAttribute('data-variant', 'inline')
    await expect(getComputedStyle(link).textDecorationLine).toBe('underline')
    await expect(getComputedStyle(link).fontWeight).toBe('400')
  },
}

/** Weight for a link that is the sentence's point. */
export const Strong: Story = {
  args: { variant: 'strong' },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', {
      name: 'the leaderboard',
    })
    await expect(link).toHaveAttribute('data-variant', 'strong')
    await expect(getComputedStyle(link).fontWeight).toBe('600')
  },
}

/** Ink, not the link colour: a way out beside a primary control. */
export const Quiet: Story = {
  args: { variant: 'quiet' },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', {
      name: 'the leaderboard',
    })
    const paragraph = link.parentElement!
    await expect(getComputedStyle(link).color).toBe(getComputedStyle(paragraph).color)
    await expect(getComputedStyle(link).textDecorationLine).toBe('underline')
  },
}

/** `render` swaps the anchor for a router Link; the paint and the slot stay. */
export const AsRouterLink: Story = {
  args: { render: <Link to="/leaderboard" /> },
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole('link', {
      name: 'the leaderboard',
    })
    await expect(link).toHaveAttribute('href', '/leaderboard')
    await expect(link).toHaveAttribute('data-slot', 'inline-link')
  },
}

export const Dark: Story = {
  render: () => (
    <span>
      <InlineLink href="#">inline</InlineLink> ·{' '}
      <InlineLink href="#" variant="strong">
        strong
      </InlineLink>{' '}
      ·{' '}
      <InlineLink href="#" variant="quiet">
        quiet
      </InlineLink>
    </span>
  ),
  globals: { theme: 'dark' },
}
