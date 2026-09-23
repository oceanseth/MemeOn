import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Checkbox } from '@/atoms/checkbox'
import { Field, FieldLabel } from '@/atoms/field'

const onCheckedChange = fn()

function ControlledCheckbox({
  initial = false,
  variant,
}: {
  initial?: boolean
  variant?: 'default' | 'pill'
}) {
  const [checked, setChecked] = useState(initial)
  return (
    <Checkbox
      label="Show private (3)"
      variant={variant}
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
    const box = canvas.getByRole('checkbox', { name: 'For sale' })
    await expect(box).not.toBeChecked()
    await expect(box).toHaveAttribute('data-slot', 'checkbox')
    await expect(box.closest('[data-slot="checkbox-label"]')).not.toBeNull()
  },
}

const TICK_D = 'M7.757 12L10.409 14.652L16.243 8.818'
const MINUS_D = 'M7.757 12H16.243'

function markSvg(root: ParentNode, d: string): SVGElement | null {
  const path = root.querySelector(`path[d="${d}"]`)
  const svg = path?.closest('svg')
  return svg instanceof SVGElement ? svg : null
}

/** Chrome 153 keeps offsetWidth on HTMLElement, so an svg's laid-out size is clientWidth. */
function markWidth(svg: SVGElement): number {
  const box = svg as SVGElement & { offsetWidth?: number }
  return box.offsetWidth ?? svg.clientWidth
}

export const Checked: Story = {
  args: { defaultChecked: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByRole('checkbox', { name: 'For sale' })
    await expect(box).toBeChecked()
    await expect(box).toHaveAttribute('data-checked')
    await expect(box).not.toHaveAttribute('data-indeterminate')
    await expect(box).not.toHaveAttribute('aria-checked', 'mixed')
    const indicator = box.querySelector('[data-slot="checkbox-indicator"]')
    await expect(indicator).not.toBeNull()
    const tick = markSvg(indicator!, TICK_D)
    await expect(tick).not.toBeNull()
    await expect(tick).toHaveAttribute('aria-hidden', 'true')
    await expect(markWidth(tick!)).toBe(16)
    const minus = markSvg(indicator!, MINUS_D)
    await expect(minus === null || markWidth(minus) === 0).toBe(true)
  },
}

/** Mixed paints a centered minus, not the house tick. */
export const Indeterminate: Story = {
  args: { indeterminate: true, label: 'Select all' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByRole('checkbox', { name: 'Select all' })
    await expect(box).toHaveAttribute('aria-checked', 'mixed')
    await expect(box).toHaveAttribute('data-indeterminate')
    await expect(box).not.toHaveAttribute('data-checked')
    const indicator = box.querySelector('[data-slot="checkbox-indicator"]')
    await expect(indicator).not.toBeNull()
    const minus = markSvg(indicator!, MINUS_D)
    await expect(minus).not.toBeNull()
    await expect(minus).toHaveAttribute('aria-hidden', 'true')
    await expect(markWidth(minus!)).toBe(16)
    const tick = markSvg(indicator!, TICK_D)
    await expect(tick === null || markWidth(tick) === 0).toBe(true)
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

/** The binder's private toggle: a real checkbox inside a raised pill that presses when checked. */
export const Pill: Story = {
  render: () => <ControlledCheckbox variant="pill" />,
  play: async ({ canvasElement }) => {
    onCheckedChange.mockClear()
    const canvas = within(canvasElement)
    const row = canvas.getByText('Show private (3)').closest('[data-slot="checkbox-label"]')!
    await expect(row).toHaveAttribute('data-variant', 'pill')
    await expect((row as HTMLElement).offsetHeight).toBe(46)
    await userEvent.click(canvas.getByText('Show private (3)'))
    await expect(canvas.getByRole('checkbox', { name: 'Show private (3)' })).toBeChecked()
  },
}

/** No `label`: just the box, for a `Field` or `Label` that labels it from outside. */
export const BareBox: Story = {
  render: () => (
    <Field>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Checkbox id="terms" />
        <FieldLabel htmlFor="terms">I read the fine print</FieldLabel>
      </div>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByRole('checkbox', { name: 'I read the fine print' })
    await expect(box.closest('[data-slot="checkbox-label"]')).toBeNull()
    // the raised 22px box on the checkbox radius
    await expect(box.offsetWidth).toBe(22)
    await userEvent.click(canvas.getByText('I read the fine print'))
    await expect(box).toBeChecked()
  },
}

export const Dark: Story = { ...Checked, globals: { theme: 'dark' } }
