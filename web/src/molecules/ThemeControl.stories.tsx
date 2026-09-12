import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { ThemePreference } from '../stores/themeStore'
import { ThemeControl } from './ThemeControl'

const onChange = fn()

const meta = {
  title: 'Molecules/ThemeControl',
  component: ThemeControl,
  args: { model: { value: 'light', onChange, variant: 'segmented' } },
} satisfies Meta<typeof ThemeControl>

export default meta
type Story = StoryObj<typeof meta>

/** The sidebar well: three segments, the current one raised. A press on it reports nothing. */
export const Segmented: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onChange.mockClear()
    const group = canvas.getByRole('group', { name: 'Theme' })
    const light = within(group).getByRole('button', { name: /Light/ })
    await expect(light).toHaveAttribute('aria-pressed', 'true')
    await expect(within(group).getByRole('button', { name: /Auto/ })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(within(group).getByRole('button', { name: /Dark/ }))
    await expect(onChange).toHaveBeenCalledWith('dark')
    onChange.mockClear()
    await userEvent.click(light)
    await expect(onChange).not.toHaveBeenCalled()
  },
}

/** The header button: the current arm's emoji, the name says where a press goes. */
export const Button: Story = {
  args: { model: { value: 'auto', onChange, variant: 'button' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onChange.mockClear()
    const button = canvas.getByRole('button', { name: 'Theme: Auto. Switch to Light' })
    await expect(button).toHaveTextContent('🌗')
    await userEvent.click(button)
    await expect(onChange).toHaveBeenCalledWith('light')
  },
}

/** The button cycles auto → light → dark → auto; the story owns the state the control reports into. */
function CyclingButton() {
  const [value, setValue] = useState<ThemePreference>('auto')
  return (
    <ThemeControl
      model={{
        value,
        onChange: (next) => {
          onChange(next)
          setValue(next)
        },
        variant: 'button',
      }}
    />
  )
}

export const ButtonCycles: Story = {
  args: { model: { value: 'auto', onChange, variant: 'button' } },
  render: () => <CyclingButton />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Theme: Auto. Switch to Light' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Theme: Light. Switch to Dark' }))
    await expect(canvas.getByRole('button', { name: 'Theme: Dark. Switch to Auto' })).toHaveTextContent('🌙')
    await userEvent.click(canvas.getByRole('button', { name: 'Theme: Dark. Switch to Auto' }))
    await expect(canvas.getByRole('button', { name: 'Theme: Auto. Switch to Light' })).toBeInTheDocument()
  },
}

export const Dark: Story = {
  args: { model: { value: 'dark', onChange, variant: 'segmented' } },
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Theme' })
    await expect(within(group).getByRole('button', { name: /Dark/ })).toHaveAttribute('aria-pressed', 'true')
  },
}
