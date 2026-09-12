import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Button } from './Button'
import { EmptyActions, EmptyState, Muted, PageState } from './EmptyState'
import { Notice } from './Notice'

const meta = {
  title: 'Atoms/EmptyState',
  component: EmptyState,
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    role: 'status',
    children: (
      <>
        <h3>No memes yet</h3>
        <p>Be the change — mint one!</p>
      </>
    ),
  },
}

export const WithActions: Story = {
  render: () => (
    <EmptyState role="status">
      <h3>No trades open</h3>
      <p>Propose something outrageous.</p>
      <EmptyActions>
        <Notice tone="ok">Copied!</Notice>
        <Button variant="primary">Find your people</Button>
      </EmptyActions>
    </EmptyState>
  ),
}

export const ErrorTone: Story = {
  args: {
    error: true,
    role: 'alert',
    children: (
      <>
        <h3>Could not load</h3>
        <p>Try again in a moment.</p>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toBeInTheDocument()
  },
}

/**
 * The five state cards the Feedback board draws (`HSU-0`): no results, retry, starter pack opened,
 * unread activity, not enough braincells. Same card, one tone apart — the tint and the heading
 * colour carry the state, and each one keeps at most a single primary.
 */
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 542 }}>
      <EmptyState>
        <h3>No memes match.</h3>
        <p>Be the change — mint one!</p>
        <EmptyActions>
          <Button variant="primary">Mint a meme</Button>
          <Button>Clear filters</Button>
        </EmptyActions>
      </EmptyState>
      <EmptyState tone="error">
        <h3>Couldn't reach the market.</h3>
        <p>Your filters are still set.</p>
        <EmptyActions>
          <Button>Try again</Button>
        </EmptyActions>
      </EmptyState>
      <EmptyState tone="ok">
        <h3>🎁 Starter pack opened!</h3>
        <p>Your first cards are waiting in My Binder.</p>
        <EmptyActions>
          <Button variant="primary">Open My Binder</Button>
        </EmptyActions>
      </EmptyState>
      <EmptyState tone="info">
        <h3>🔔 Your corner is moving</h3>
        <p>Your card reached Holo · 2 minutes ago.</p>
        <EmptyActions>
          <Button>See what happened</Button>
        </EmptyActions>
      </EmptyState>
      <EmptyState tone="warning">
        <h3>Not enough braincells</h3>
        <p>Earn more through quests, or choose fewer shares.</p>
        <EmptyActions>
          <Button>Earn braincells</Button>
        </EmptyActions>
      </EmptyState>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cards = canvasElement.querySelectorAll('[data-slot="empty-state"]')
    await expect(cards).toHaveLength(5)
    await expect([...cards].map((card) => (card as HTMLElement).dataset.tone)).toEqual([
      'neutral',
      'error',
      'ok',
      'info',
      'warning',
    ])
    // the error card keeps the live-region contract the tone implies
    await expect(canvas.getByRole('alert')).toHaveAttribute('data-tone', 'error')
    // one bubblegum per card, never two
    for (const card of cards) {
      await expect(card.querySelectorAll('.bg-action').length).toBeLessThanOrEqual(1)
    }
  },
}

export const TonesDark: Story = { ...Tones, globals: { theme: 'dark' } }

export const PageStateExample: Story = {
  render: () => <PageState>Loading…</PageState>,
}

export const MutedExample: Story = {
  render: () => <Muted>Just a quiet caption.</Muted>,
}

export const Dark: Story = { ...WithActions, globals: { theme: 'dark' } }
