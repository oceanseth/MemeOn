import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Spinner } from './Spinner'

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const spinner = canvasElement.querySelector('[data-slot="spinner"]')
    await expect(spinner).toHaveAttribute('aria-hidden', 'true')
  },
}

/** Beside a line of copy, matching how a labelled loading row places it. */
export const BesideLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-dim)' }}>
      <Spinner />
      Loading…
    </div>
  ),
}
