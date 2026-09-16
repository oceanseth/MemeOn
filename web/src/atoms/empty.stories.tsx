import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Alert } from '@/atoms/alert'
import { Button } from '@/atoms/button'
import {
  Empty,
  EmptyActions,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyState,
  EmptyTitle,
  PageState,
} from '@/atoms/empty'

const meta = {
  title: 'Atoms/Empty',
  component: Empty,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 542 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Empty>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No memes yet</EmptyTitle>
        <EmptyDescription>Be the change — mint one!</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = canvas.getByRole('status')
    await expect(card).toHaveAttribute('data-slot', 'empty')
    await expect(card).toHaveAttribute('data-variant', 'neutral')
    const title = canvas.getByText('No memes yet')
    await expect(title.tagName).toBe('H3')
    await expect(title).toHaveAttribute('data-slot', 'empty-title')
    await expect(canvas.getByText('Be the change — mint one!')).toHaveAttribute(
      'data-slot',
      'empty-description',
    )
  },
}

export const WithActions: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No trades open</EmptyTitle>
        <EmptyDescription>Propose something outrageous.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Alert variant="success">Copied!</Alert>
        <Button variant="primary">Find your people</Button>
      </EmptyContent>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', { name: 'Find your people' }).closest('[data-slot="empty-content"]'),
    ).not.toBeNull()
  },
}

/** An emoji at the hero step above the words. */
export const WithMedia: Story = {
  render: () => (
    <Empty variant="success">
      <EmptyHeader>
        <EmptyMedia>🎁</EmptyMedia>
        <EmptyTitle>Starter pack opened!</EmptyTitle>
        <EmptyDescription>Your first cards are waiting in My Binder.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="primary">Open My Binder</Button>
      </EmptyContent>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    const media = canvasElement.querySelector('[data-slot="empty-media"]')
    await expect(media).toHaveAttribute('data-variant', 'default')
    await expect(media).toHaveAttribute('aria-hidden', 'true')
  },
}

/** The title as an `h2` where the page outline needs it. */
export const ErrorVariant: Story = {
  render: () => (
    <Empty variant="error">
      <EmptyHeader>
        <EmptyTitle render={<h2 />}>Could not load</EmptyTitle>
        <EmptyDescription>Try again in a moment.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Try again</Button>
      </EmptyContent>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveAttribute('data-variant', 'error')
    await expect(canvas.getByText('Could not load').tagName).toBe('H2')
  },
}

/** The mint flow's approval card: field radius, tight inset, left-aligned, the phone title step. */
export const Inline: Story = {
  render: () => (
    <Empty variant="success" size="inline" role="none">
      <EmptyHeader>
        <EmptyTitle>✅ Edit applied — happy with this frame?</EmptyTitle>
        <EmptyDescription>
          Keep it, then animate it or run another edit — check the card preview before you mint.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="empty"]')!
    await expect(card).toHaveAttribute('data-size', 'inline')
    await expect(getComputedStyle(card).textAlign).toBe('left')
    // inside the inline card the title steps down to the display face's floor
    await expect(getComputedStyle(canvas.getByText(/Edit applied/)).fontSize).toBe(
      getComputedStyle(document.documentElement).getPropertyValue('--text-xl').trim(),
    )
  },
}

/** Every variant stacked. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No memes match.</EmptyTitle>
          <EmptyDescription>Be the change — mint one!</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="primary">Mint a meme</Button>
          <Button>Clear filters</Button>
        </EmptyContent>
      </Empty>
      <Empty variant="error">
        <EmptyHeader>
          <EmptyTitle>Couldn't reach the market.</EmptyTitle>
          <EmptyDescription>Your filters are still set.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Try again</Button>
        </EmptyContent>
      </Empty>
      <Empty variant="success">
        <EmptyHeader>
          <EmptyTitle>🎁 Starter pack opened!</EmptyTitle>
          <EmptyDescription>Your first cards are waiting in My Binder.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="primary">Open My Binder</Button>
        </EmptyContent>
      </Empty>
      <Empty variant="info">
        <EmptyHeader>
          <EmptyTitle>🔔 Your corner is moving</EmptyTitle>
          <EmptyDescription>Your card reached Holo · 2 minutes ago.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>See what happened</Button>
        </EmptyContent>
      </Empty>
      <Empty variant="warning">
        <EmptyHeader>
          <EmptyTitle>Not enough braincells</EmptyTitle>
          <EmptyDescription>Earn more through quests, or choose fewer shares.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Earn braincells</Button>
        </EmptyContent>
      </Empty>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cards = canvasElement.querySelectorAll('[data-slot="empty"]')
    await expect(cards).toHaveLength(5)
    await expect([...cards].map((card) => (card as HTMLElement).dataset.variant)).toEqual([
      'neutral',
      'error',
      'success',
      'info',
      'warning',
    ])
    // the error card keeps the live-region contract the variant implies
    await expect(canvas.getByRole('alert')).toHaveAttribute('data-variant', 'error')
    // one bubblegum per card, never two
    for (const card of cards) {
      await expect(card.querySelectorAll('.bg-primary').length).toBeLessThanOrEqual(1)
    }
  },
}

export const VariantsDark: Story = { ...Variants, globals: { theme: 'dark' } }

export const PageStateExample: Story = {
  render: () => <PageState>Loading…</PageState>,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="page-state"]')).toHaveAttribute(
      'data-size',
      'default',
    )
  },
}

/** The end-of-list note under the market grid. */
export const PageStateCompact: Story = {
  render: () => <PageState size="compact">That's every card.</PageState>,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="page-state"]')).toHaveAttribute(
      'data-size',
      'compact',
    )
  },
}

/** The legacy `EmptyState` the ten screens still render: raw headings, tone names, `error` flag. */
export const LegacyEmptyState: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <EmptyState role="none">
        <h3>No memes yet</h3>
        <p>Be the change — mint one!</p>
        <EmptyActions>
          <Button variant="primary">Mint a meme</Button>
        </EmptyActions>
      </EmptyState>
      <EmptyState error>
        <p>
          <strong>Could not load</strong>
        </p>
        <EmptyActions>
          <Button>Try again</Button>
        </EmptyActions>
      </EmptyState>
      <EmptyState tone="ok">
        <h3>🎁 Starter pack opened!</h3>
        <p>Your first cards are waiting in My Binder.</p>
      </EmptyState>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cards = canvasElement.querySelectorAll('[data-slot="empty-state"]')
    await expect(cards).toHaveLength(3)
    await expect([...cards].map((card) => (card as HTMLElement).dataset.tone)).toEqual([
      'neutral',
      'error',
      'ok',
    ])
    await expect(canvas.getByRole('alert')).toHaveAttribute('data-tone', 'error')
    await expect(canvasElement.querySelectorAll('[data-slot="empty-actions"]')).toHaveLength(2)
  },
}

/** Work in flight inside a form panel: the raised fill, the title muted with the body. */
export const Busy: Story = {
  render: () => (
    <Empty variant="busy" size="inline" role="none">
      <EmptyHeader>
        <EmptyTitle>Cooking your frame…</EmptyTitle>
      </EmptyHeader>
      <EmptyDescription>The card stays here while the frame cooks.</EmptyDescription>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    const empty = canvasElement.querySelector<HTMLElement>('[data-slot="empty"]')!
    await expect(empty).toHaveAttribute('data-variant', 'busy')
    const title = empty.querySelector<HTMLElement>('[data-slot="empty-title"]')!
    await expect(getComputedStyle(title).color).toBe(getComputedStyle(empty).color)
  },
}

export const Dark: Story = { ...WithActions, globals: { theme: 'dark' } }
