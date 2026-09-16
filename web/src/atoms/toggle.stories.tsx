import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Toggle } from '@/atoms/toggle'

const onPressedChange = fn()

const meta = {
  title: 'Atoms/Toggle',
  component: Toggle,
  args: { children: 'Newest', onPressedChange },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

/** Off: a raised pill; a press sinks it into the pressed well and Base UI reports it. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    onPressedChange.mockClear()
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole('button', { name: 'Newest', pressed: false })
    await expect(toggle).toHaveAttribute('data-slot', 'toggle')
    await expect(toggle).toHaveAttribute('data-variant', 'default')
    await expect(toggle.offsetHeight).toBe(46)
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(toggle).toHaveAttribute('data-pressed')
    await expect(onPressedChange).toHaveBeenCalledWith(true, expect.anything())
    // the pressed material is a well, so the relief runs inset-first
    await expect(getComputedStyle(toggle).boxShadow).toContain('inset')
  },
}

export const Pressed: Story = {
  args: { defaultPressed: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Newest', pressed: true })).toHaveAttribute('data-pressed')
  },
}

/** Transparent at rest — a glyph in a toolbar; pressed, it sinks into the well. */
export const Ghost: Story = {
  args: { variant: 'ghost', children: '🔔' , 'aria-label': 'Mute alerts' },
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole('button', { name: 'Mute alerts' })
    await expect(getComputedStyle(toggle).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  },
}

/** Every size on the default material, then the ghost. `segment` lives inside a ToggleGroup well. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <Toggle>Default</Toggle>
      <Toggle size="sm">Small</Toggle>
      <Toggle size="chip">Chip</Toggle>
      <Toggle size="icon" aria-label="Sort">
        ↕️
      </Toggle>
      <Toggle variant="ghost">Ghost</Toggle>
      <Toggle defaultPressed>Pressed</Toggle>
      <Toggle disabled>Disabled</Toggle>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('button')).toHaveLength(7)
    await expect(canvas.getByRole('button', { name: 'Small' }).offsetHeight).toBe(34)
    await expect(canvas.getByRole('button', { name: 'Chip' })).toHaveAttribute('data-size', 'chip')
    const icon = canvas.getByRole('button', { name: 'Sort' })
    await expect(icon.offsetWidth).toBe(34)
    await expect(icon.offsetHeight).toBe(34)
    await expect(canvas.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Newest' })).toBeDisabled()
  },
}

export const Dark: Story = { ...Sizes, globals: { theme: 'dark' } }
