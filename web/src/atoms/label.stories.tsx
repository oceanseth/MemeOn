import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Checkbox } from '@/atoms/checkbox'
import { Input } from '@/atoms/input'
import { Label } from '@/atoms/label'

const meta = {
  title: 'Atoms/Label',
  component: Label,
  args: { children: 'Share link' },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

/** A bare label wired to its control by `htmlFor`, outside a `<Field>`. */
export const Default: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 6 }}>
      <Label htmlFor="share">Share link</Label>
      <Input id="share" defaultValue="https://memeon.lol/m/meme-holo" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Share link')).toHaveValue('https://memeon.lol/m/meme-holo')
    await expect(canvas.getByText('Share link')).toHaveAttribute('data-slot', 'label')
  },
}

/** Wrapping a control: the row is one flex line, so the box sits on the text baseline. */
export const WrappingAControl: Story = {
  render: () => (
    <Label>
      <Checkbox defaultChecked />
      For sale
    </Label>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: 'For sale' })).toBeChecked()
  },
}

/** A disabled `peer` control dims the label after it. */
export const PeerDisabled: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Checkbox id="locked" disabled />
      <Label htmlFor="locked">Locked</Label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: 'Locked' })).toHaveAttribute('data-disabled')
    await expect(Number(getComputedStyle(canvas.getByText('Locked')).opacity)).toBeLessThan(1)
  },
}

export const Dark: Story = { ...WrappingAControl, globals: { theme: 'dark' } }
