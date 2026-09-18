import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Spinner } from '@/atoms/spinner'

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

/** Decorative by default: the parent owns the status, so the ring is hidden from the tree. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const spinner = canvasElement.querySelector<HTMLElement>('[data-slot="spinner"]')!
    await expect(spinner).toHaveAttribute('aria-hidden', 'true')
    await expect(spinner).toHaveAttribute('data-size', 'sm')
    await expect(spinner.offsetWidth).toBe(18)
  },
}

/** Beside a line of copy, matching how a labelled loading row places it. */
export const BesideLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-muted-foreground)' }}>
      <Spinner />
      Loading…
    </div>
  ),
}

/** The 24px ring of a full-panel wait (the Discord link status card). */
export const Medium: Story = {
  args: { size: 'md' },
  play: async ({ canvasElement }) => {
    const spinner = canvasElement.querySelector<HTMLElement>('[data-slot="spinner"]')!
    await expect(spinner).toHaveAttribute('data-size', 'md')
    await expect(spinner.offsetWidth).toBe(24)
  },
}

/** `tone="current"`: the ring takes the host's text colour, which is how a busy Button carries it. */
export const Current: Story = {
  render: () => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-primary)',
        color: 'var(--color-primary-foreground)',
      }}
    >
      <Spinner tone="current" />
      Minting…
    </div>
  ),
}

/** The 38px ring a whole route waits on. */
export const Large: Story = {
  args: { size: 'lg' },
  play: async ({ canvasElement }) => {
    const spinner = canvasElement.querySelector<HTMLElement>('[data-slot="spinner"]')!
    await expect(spinner).toHaveAttribute('data-size', 'lg')
    await expect(spinner.offsetHeight).toBe(38)
  },
}

export const Dark: Story = { ...BesideLabel, globals: { theme: 'dark' } }
