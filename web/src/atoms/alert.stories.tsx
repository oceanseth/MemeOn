import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/atoms/alert'
import { Button } from '@/atoms/button'
import { Spinner } from '@/atoms/spinner'

const meta = {
  title: 'Atoms/Alert',
  component: Alert,
  args: { children: 'Saved.' },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: { variant: 'success' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const alert = canvas.getByRole('status')
    await expect(alert).toHaveAttribute('data-slot', 'alert')
    await expect(alert).toHaveAttribute('data-variant', 'success')
  },
}

/** An error interrupts: `role="alert"` without being asked. */
export const ErrorVariant: Story = {
  args: { variant: 'error', children: 'Could not save.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveAttribute('data-variant', 'error')
  },
}

export const Info: Story = { args: { variant: 'info', children: 'Heads up.' } }
export const Warning: Story = {
  args: { variant: 'warning', children: 'This one is final.' },
}

/** A one-line message takes the field radius. */
export const Compact: Story = {
  args: { variant: 'error', size: 'compact', children: 'Sign in first.' },
}

/** Title, description and an action row inside the band. */
export const WithParts: Story = {
  render: () => (
    <Alert variant="warning">
      <AlertTitle>Trades are final.</AlertTitle>
      <AlertDescription>
        Once your friend accepts, the cards and braincells move at once and cannot come back.
      </AlertDescription>
      <AlertAction>
        <Button>Review the offer</Button>
      </AlertAction>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Trades are final.')).toHaveAttribute('data-slot', 'alert-title')
    await expect(canvasElement.querySelector('[data-slot="alert-description"]')).not.toBeNull()
    await expect(
      canvas
        .getByRole('button', { name: 'Review the offer' })
        .closest('[data-slot="alert-action"]'),
    ).not.toBeNull()
  },
}

/** Every variant stacked, which is what the dark twin shoots. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', justifyItems: 'start', gap: 12, padding: 16 }}>
      <Alert variant="success">Minted — it is in your binder.</Alert>
      <Alert variant="info">Braincells are play money.</Alert>
      <Alert variant="warning">Trades are final.</Alert>
      <Alert variant="error">Could not save.</Alert>
      <Alert variant="info" role="none" className="inline-flex items-center gap-2">
        <Spinner />
        Working…
      </Alert>
    </div>
  ),
}

export const Dark: Story = { ...Variants, globals: { theme: 'dark' } }

/** A screen can quiet an error down to role="status" when it isn't the primary outcome. */
export const RoleOverride: Story = {
  args: { variant: 'error', role: 'status', children: 'Quiet error.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toBeInTheDocument()
  },
}
