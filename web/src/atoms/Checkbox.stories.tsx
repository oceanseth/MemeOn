import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Checkbox } from './Checkbox'

const onCheckedChange = fn()

function ControlledCheckbox({ initial = false }: { initial?: boolean }) {
  const [checked, setChecked] = useState(initial)
  return (
    <Checkbox
      label="Show private (3)"
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next)
        onCheckedChange(next)
      }}
    />
  )
}

const meta = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  args: { label: 'For sale' },
  decorators: [
    (Story) => (
      <div style={{ padding: 8 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: 'For sale' })).not.toBeChecked()
  },
}

export const Checked: Story = {
  args: { defaultChecked: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByRole('checkbox', { name: 'For sale' })
    await expect(box).toBeChecked()
    await expect(box).toHaveAttribute('data-checked')
  },
}

/** The whole 44px row is the target, so a click on the words toggles the box. */
export const TogglesFromTheLabel: Story = {
  render: () => <ControlledCheckbox />,
  play: async ({ canvasElement }) => {
    onCheckedChange.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Show private (3)'))
    await expect(onCheckedChange).toHaveBeenCalledTimes(1)
    await expect(onCheckedChange).toHaveBeenCalledWith(true)
    await expect(canvas.getByRole('checkbox', { name: 'Show private (3)' })).toBeChecked()
  },
}

export const TogglesFromTheKeyboard: Story = {
  render: () => <ControlledCheckbox initial />,
  play: async ({ canvasElement }) => {
    onCheckedChange.mockClear()
    const canvas = within(canvasElement)
    await userEvent.tab()
    const box = canvas.getByRole('checkbox', { name: 'Show private (3)' })
    await expect(box).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(onCheckedChange).toHaveBeenCalledWith(false)
  },
}

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: 'For sale' })).toHaveAttribute(
      'data-disabled',
    )
  },
}

export const Dark: Story = { ...Checked, globals: { theme: 'dark' } }
