import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { Field, FieldHint, FieldLabel } from './Field'
import { Select, type SelectOption } from './Select'

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
function ControlledSelect({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState<string | null>(initial)
  return (
    <Select
      items={tiers}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onValueChange(next)
      }}
      aria-label="Tier"
    />
  )
}

/**
 * The preview stubs `IntersectionObserver` so a connected view can drive it, and that stub reports
 * into a scenario an atom story never starts. Base UI's positioner watches layout shift with one,
 * so these stories lend it an inert observer for the duration of the story.
 */
class InertIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = '0px'
  readonly thresholds = [0]
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
  unobserve() {}
}

const meta = {
  title: 'Atoms/Select',
  component: Select,
  args: { items: tiers, 'aria-label': 'Tier' },
  beforeEach: () => {
    const original = window.IntersectionObserver
    window.IntersectionObserver = InertIntersectionObserver
    return () => {
      window.IntersectionObserver = original
    }
  },
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
    await expect(trigger).toHaveAttribute('data-slot', 'select')
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
    await expect(within(listbox).getByRole('option', { name: 'Holo' })).toHaveAttribute(
      'data-selected',
    )
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
    await userEvent.keyboard('gol')
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

export const InField: Story = {
  render: () => (
    <Field>
      <FieldLabel>Tier</FieldLabel>
      <ControlledSelect initial="silver" />
      <FieldHint>Rarity climbs with reshares.</FieldHint>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('combobox', { name: 'Tier' })).toHaveTextContent('Silver')
  },
}
