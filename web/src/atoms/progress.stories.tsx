import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Progress, ProgressLabel, ProgressValue } from '@/atoms/progress'

const meta = {
  title: 'Atoms/Progress',
  component: Progress,
  args: { value: 40 },
  decorators: [
    (Story) => (
      <div className="w-80 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

/** Label and value on the row above the track; Base UI owns the progressbar semantics. */
export const Default: Story = {
  render: (args) => (
    <Progress {...args}>
      <ProgressLabel>Ownership</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole('progressbar', { name: 'Ownership' })
    await expect(bar).toHaveAttribute('data-slot', 'progress')
    await expect(bar).toHaveAttribute('aria-valuenow', '40')
    await expect(bar).toHaveAttribute('data-progressing')
    await expect(canvasElement.querySelector('[data-slot="progress-value"]')).toHaveTextContent(
      '40%',
    )
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="progress-track"]')!
    const indicator = canvasElement.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!
    await expect(track.offsetHeight).toBe(6)
    await expect(indicator.offsetWidth / track.offsetWidth).toBeCloseTo(0.4, 1)
    await expect(indicator).toHaveAttribute('data-variant', 'default')
  },
}

/** The rank meter's sweep: brand → primary → brand. */
export const Ladder: Story = {
  args: { value: 65, variant: 'ladder', 'aria-label': 'Rank' },
  play: async ({ canvasElement }) => {
    const indicator = canvasElement.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!
    await expect(indicator).toHaveAttribute('data-variant', 'ladder')
    await expect(getComputedStyle(indicator).backgroundImage).toContain('linear-gradient')
  },
}

/** `value={null}`: a pulsing third of the track, and no `aria-valuenow`. */
export const Indeterminate: Story = {
  args: { value: null, 'aria-label': 'Uploading' },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar', {
      name: 'Uploading',
    })
    await expect(bar).toHaveAttribute('data-indeterminate')
    await expect(bar).not.toHaveAttribute('aria-valuenow')
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="progress-track"]')!
    const indicator = canvasElement.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!
    await expect(indicator).toHaveAttribute('data-indeterminate')
    await expect(indicator.offsetWidth / track.offsetWidth).toBeCloseTo(1 / 3, 1)
  },
}

export const Complete: Story = {
  args: { value: 100, 'aria-label': 'Done' },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar', { name: 'Done' })
    await expect(bar).toHaveAttribute('data-complete')
    const track = canvasElement.querySelector<HTMLElement>('[data-slot="progress-track"]')!
    const indicator = canvasElement.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!
    await expect(indicator.offsetWidth).toBe(track.offsetWidth)
  },
}

/** The binder's ownership groove: braincell gold, not the action colour. */
export const Braincell: Story = {
  args: { value: 60, variant: 'braincell', 'aria-label': 'Shares owned' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="progress-indicator"]')).toHaveAttribute(
      'data-variant',
      'braincell',
    )
  },
}

export const Dark: Story = { ...Ladder, globals: { theme: 'dark' } }
