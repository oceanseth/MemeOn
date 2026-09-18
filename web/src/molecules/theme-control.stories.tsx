import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { ThemePreference } from '../stores/themeStore'
import { ThemeControl } from '@/molecules/theme-control'

const onChange = fn()

const meta = {
  title: 'Molecules/ThemeControl',
  component: ThemeControl,
  args: { model: { value: 'light', onChange, variant: 'segmented' } },
} satisfies Meta<typeof ThemeControl>

export default meta
type Story = StoryObj<typeof meta>

/** The Settings well: three segments, the current one raised. A press on it reports nothing. */
export const Segmented: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onChange.mockClear()
    const group = canvas.getByRole('group', { name: 'Theme' })
    /* 224 × 42: three 34px segments inside the well's 4px inset */
    await expect(getComputedStyle(group).width).toBe('224px')
    await expect(getComputedStyle(group).height).toBe('42px')
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
export const HeaderButton: Story = {
  args: { model: { value: 'auto', onChange, variant: 'button' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onChange.mockClear()
    const button = canvas.getByRole('button', { name: 'Theme: Auto. Switch to Light' })
    await expect(button.querySelector('svg')).not.toBeNull()
    /* the Button atom's 34px square: the control the whole chrome uses */
    await expect(getComputedStyle(button).height).toBe('34px')
    await userEvent.click(button)
    await expect(onChange).toHaveBeenCalledWith('light')
  },
}

/**
 * The public desktop header has room in its cluster, so its square grows past the
 * shell cut. It is the control's own size, not a class the screen passes.
 */
export const HeaderButtonPublic: Story = {
  args: { model: { value: 'dark', onChange, variant: 'button' }, size: 'lg' },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Theme: Dark. Switch to Auto' })
    await expect(button).toHaveAttribute('data-preference', 'dark')
    /* the story canvas is wider than the 900px cut */
    await expect(getComputedStyle(button).height).toBe('40px')
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
    await expect(canvas.getByRole('button', { name: 'Theme: Dark. Switch to Auto' }).querySelector('svg')).not.toBeNull()
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
