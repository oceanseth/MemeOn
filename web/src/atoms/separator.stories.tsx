import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Separator } from '@/atoms/separator'

const meta = {
  title: 'Atoms/Separator',
  component: Separator,
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

/** A hairline between two blocks. */
export const Horizontal: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-3 p-4 text-label text-foreground">
      <span>Above</span>
      <Separator {...args} />
      <span>Below</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole('separator')
    await expect(separator).toHaveAttribute('data-slot', 'separator')
    await expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    await expect(separator.offsetHeight).toBe(1)
    await expect(separator.offsetWidth).toBeGreaterThan(200)
  },
}

/** Standing in a row, it stretches to the row's height. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className="flex h-12 items-center gap-3 p-4 text-label text-foreground">
      <span>Left</span>
      <Separator {...args} />
      <span>Right</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole('separator')
    await expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    await expect(separator).toHaveAttribute('data-orientation', 'vertical')
    await expect(separator.offsetWidth).toBe(1)
    await expect(separator.offsetHeight).toBeGreaterThan(1)
  },
}

export const Dark: Story = { ...Horizontal, globals: { theme: 'dark' } }
