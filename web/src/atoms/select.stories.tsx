import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { Field, FieldDescription, FieldLabel } from '@/atoms/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  type SelectOption,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/atoms/select'

const tiers: SelectOption[] = [
  { value: '', label: 'All tiers' },
  { value: 'paper', label: 'Paper' },
  { value: 'silver', label: 'Silver' },
  { value: 'holo', label: 'Holo' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'gold', label: 'Gold' },
  { value: 'prismatic', label: 'Prismatic' },
  { value: 'shiny', label: 'Shiny' },
]

const onValueChange = fn()

/** Controlled is the only mode the screens use, so the stories drive it the same way. */
function ControlledSelect({
  initial = '',
  variant,
}: {
  initial?: string
  variant?: 'default' | 'pill'
}) {
  const [value, setValue] = useState<string | null>(initial)
  return (
    <Select
      items={tiers}
      value={value}
      variant={variant}
      onValueChange={(next) => {
        setValue(next)
        onValueChange(next)
      }}
      aria-label="Tier"
    />
  )
}

const meta = {
  title: 'Atoms/Select',
  component: Select,
  args: { items: tiers, 'aria-label': 'Tier' },
  decorators: [
    (Story) => (
      <div style={{ padding: 8 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { value: 'holo' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox', { name: 'Tier' })
    await expect(trigger).toHaveAttribute('data-slot', 'select-trigger')
    await expect(trigger).toHaveAttribute('data-variant', 'default')
    await expect(trigger).toHaveTextContent('Holo')
  },
}

export const Placeholder: Story = {
  args: { value: null, placeholder: 'Pick a tier…' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('combobox', { name: 'Tier' })).toHaveTextContent('Pick a tier…')
  },
}

export const Open: Story = {
  args: { value: 'holo' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Tier' }))
    const listbox = await screen.findByRole('listbox')
    await expect(listbox.closest('[data-slot="select-content"]')).not.toBeNull()
    const holo = within(listbox).getByRole('option', { name: 'Holo' })
    await expect(holo).toHaveAttribute('data-selected')
    await expect(holo).toHaveAttribute('data-slot', 'select-item')
    const indicator = holo.querySelector('[data-slot="select-item-indicator"]')
    await expect(indicator).not.toBeNull()
    await expect(indicator!.querySelector('svg')).not.toBeNull()
    await expect(within(listbox).getAllByRole('option')).toHaveLength(tiers.length)
  },
}

/** Arrow keys move the highlight and Enter commits it — the contract the native control had. */
export const KeyboardNavigation: Story = {
  render: () => <ControlledSelect initial="paper" />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox', { name: 'Tier' })
    await userEvent.tab()
    await expect(trigger).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const listbox = await screen.findByRole('listbox')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(within(listbox).getByRole('option', { name: 'Holo' })).toHaveAttribute(
        'data-highlighted',
      ),
    )
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('holo'))
    await expect(trigger).toHaveTextContent('Holo')
  },
}

/** Typing jumps to the first match, exactly as a native `<select>` did. */
export const Typeahead: Story = {
  render: () => <ControlledSelect initial="paper" />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox', { name: 'Tier' })
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    const listbox = await screen.findByRole('listbox')
    // one dispatch, no inter-key timer: Base UI resets its typeahead buffer on a pause
    await userEvent.keyboard('gol', { delay: null })
    await waitFor(() =>
      expect(within(listbox).getByRole('option', { name: 'Gold' })).toHaveAttribute(
        'data-highlighted',
      ),
    )
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('gold'))
    await expect(trigger).toHaveTextContent('Gold')
  },
}

export const DisabledItem: Story = {
  args: {
    value: '',
    items: [
      { value: '', label: 'All media' },
      { value: 'image', label: 'Images' },
      { value: 'video', label: 'Videos', disabled: true },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Tier' }))
    const listbox = await screen.findByRole('listbox')
    await expect(within(listbox).getByRole('option', { name: 'Videos' })).toHaveAttribute(
      'data-disabled',
    )
  },
}

export const Disabled: Story = {
  args: { value: 'holo', disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('combobox', { name: 'Tier' })).toBeDisabled()
  },
}

/**
 * The native control was as wide as its widest option, so the sticky filter row never moved. The
 * trigger reserves that same width, so picking the longest label leaves its neighbours where they are.
 */
export const StableWidth: Story = {
  render: () => <ControlledSelect initial="holo" />,
  play: async ({ canvasElement }) => {
    onValueChange.mockClear()
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox', { name: 'Tier' })
    await expect(trigger.querySelector('[data-slot="select-sizer"]')).not.toBeNull()
    const widthAtHolo = trigger.getBoundingClientRect().width
    await userEvent.click(trigger)
    const listbox = await screen.findByRole('listbox')
    await userEvent.click(within(listbox).getByRole('option', { name: 'Prismatic' }))
    await waitFor(() => expect(trigger).toHaveTextContent('Prismatic'))
    await expect(trigger.getBoundingClientRect().width).toBeCloseTo(widthAtHolo, 1)
  },
}

export const InField: Story = {
  render: () => (
    <Field>
      <FieldLabel>Tier</FieldLabel>
      <ControlledSelect initial="silver" />
      <FieldDescription>Rarity climbs with reshares.</FieldDescription>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('combobox', { name: 'Tier' })).toHaveTextContent('Silver')
  },
}

/** The market's tier filter: a raised toolbar pill, the same material as the buttons beside it. */
export const Pill: Story = {
  render: () => <ControlledSelect initial="" variant="pill" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox', { name: 'Tier' })
    await expect(trigger).toHaveAttribute('data-variant', 'pill')
    // the control height, not the field height
    await expect(trigger.offsetHeight).toBe(46)
  },
}

/**
 * Composed from the parts, with groups: what a screen writes when the items array is not enough.
 * The root still takes `items` so `SelectValue` shows the label, not the value.
 */
export const Composed: Story = {
  render: () => (
    <SelectRoot
      defaultValue="holo"
      items={{ paper: 'Paper', silver: 'Silver', holo: 'Holo', shiny: 'Shiny' }}
    >
      <SelectTrigger aria-label="Tier">
        <SelectValue />
      </SelectTrigger>
      <SelectContent aria-label="Tier">
        <SelectGroup>
          <SelectLabel>Common</SelectLabel>
          <SelectItem value="paper">Paper</SelectItem>
          <SelectItem value="silver">Silver</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Rare</SelectLabel>
          <SelectItem value="holo">Holo</SelectItem>
          <SelectItem value="shiny">Shiny</SelectItem>
        </SelectGroup>
      </SelectContent>
    </SelectRoot>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox', { name: 'Tier' })
    await expect(trigger).toHaveAttribute('data-slot', 'select-trigger')
    await expect(trigger).toHaveTextContent('Holo')
    await userEvent.click(trigger)
    const listbox = await screen.findByRole('listbox')
    await expect(within(listbox).getAllByRole('group')).toHaveLength(2)
    // the popup fades in, so visibility is awaited rather than read on the first frame
    await waitFor(() =>
      expect(within(listbox).getByRole('option', { name: 'Shiny' })).toBeVisible(),
    )
  },
}

/** The popup is a raised card over the page; the highlighted row is the pressed well. */
export const Dark: Story = { ...Open, globals: { theme: 'dark' } }
