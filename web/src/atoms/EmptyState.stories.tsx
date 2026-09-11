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

export const PageStateExample: Story = {
  render: () => <PageState>Loading…</PageState>,
}

export const MutedExample: Story = {
  render: () => <Muted>Just a quiet caption.</Muted>,
}

export const Dark: Story = { ...WithActions, globals: { theme: 'dark' } }
