import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Alert } from '@/atoms/alert'
import { LiveRegion } from '@/atoms/live-region'

const meta = {
  title: 'Atoms/LiveRegion',
  component: LiveRegion,
  args: { children: 'Saved.' },
} satisfies Meta<typeof LiveRegion>

export default meta
type Story = StoryObj<typeof meta>

/** Announce-only: `role="status"`, polite, atomic, and visually hidden. */
export const Hidden: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('status')
    await expect(region).toHaveAttribute('data-slot', 'live-region')
    await expect(region).toHaveAttribute('data-variant', 'hidden')
    await expect(region).toHaveAttribute('aria-live', 'polite')
    await expect(region).toHaveAttribute('aria-atomic', 'true')
    await expect(region).toHaveTextContent('Saved.')
    // sr-only: a 1px box clipped off-flow
    await expect(getComputedStyle(region).position).toBe('absolute')
    await expect(region.offsetWidth).toBe(1)
  },
}

/** Assertive reads as an alert. */
export const Assertive: Story = {
  args: { politeness: 'assertive', children: 'Upload failed.' },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('alert')
    await expect(region).toHaveAttribute('aria-live', 'assertive')
  },
}

/** An explicit role wins over the politeness default. */
export const ExplicitRole: Story = {
  args: { role: 'log', children: 'Lou joined.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('log')).toHaveAttribute('aria-live', 'polite')
  },
}

/** The wrapper an Alert lands in: visible while it has content, collapsed while it has none. */
export const Visible: Story = {
  args: { variant: 'visible' },
  render: ({ variant }) => (
    <div className="flex flex-col gap-4 p-4">
      <LiveRegion variant={variant} data-testid="filled">
        <Alert variant="success">Trade accepted.</Alert>
      </LiveRegion>
      <LiveRegion variant={variant} data-testid="empty" />
      <span className="text-base text-muted-foreground">below both regions</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const filled = canvas.getByTestId('filled')
    await expect(filled).toHaveAttribute('data-variant', 'visible')
    await expect(getComputedStyle(filled).position).not.toBe('absolute')
    await expect(filled.offsetHeight).toBeGreaterThan(20)
    const empty = canvas.getByTestId('empty')
    await expect(getComputedStyle(empty).display).toBe('none')
  },
}

export const Dark: Story = { ...Visible, globals: { theme: 'dark' } }
