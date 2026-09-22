import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import {
  Field,
  FieldCounter,
  FieldDescription,
  FieldError,
  FieldFooter,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Hint,
} from '@/atoms/field'
import { Input } from '@/atoms/input'

const meta = {
  title: 'Atoms/Field',
  component: Field,
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Field>
      <FieldLabel>Share link</FieldLabel>
      <Input defaultValue="https://memeon.lol/m/meme-holo" />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Share link')).toHaveValue('https://memeon.lol/m/meme-holo')
    await expect(canvas.getByText('Share link')).toHaveAttribute('data-slot', 'field-label')
  },
}

export const WithDescription: Story = {
  render: () => (
    <Field>
      <FieldLabel>Tags</FieldLabel>
      <Input placeholder="cat, chaos, monday" />
      <FieldDescription>Up to five, comma separated.</FieldDescription>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Tags')).toHaveAccessibleDescription(
      'Up to five, comma separated.',
    )
    await expect(canvas.getByText('Up to five, comma separated.')).toHaveAttribute(
      'data-slot',
      'field-description',
    )
  },
}

/** The Create screen's capped title field: help on the left, counter on the right, one row. */
export const WithCounter: Story = {
  render: () => (
    <Field>
      <FieldLabel>Title</FieldLabel>
      <Input defaultValue="chrome streak" maxLength={20} />
      <FieldFooter>
        <FieldDescription>Up to 20 characters — it has to fit the card banner.</FieldDescription>
        <FieldCounter>13 / 20</FieldCounter>
      </FieldFooter>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('13 / 20')).toBeVisible()
  },
}

/** The counter at the cap. Both captions share one line, exactly as the floated legacy pair did. */
export const AtLimit: Story = {
  render: () => (
    <Field>
      <FieldLabel>Title</FieldLabel>
      <Input defaultValue="twenty characters ok" maxLength={20} />
      <FieldFooter>
        <FieldDescription>Up to 20 characters — it has to fit the card banner.</FieldDescription>
        <FieldCounter>20 / 20</FieldCounter>
      </FieldFooter>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const hint = canvas.getByText('Up to 20 characters — it has to fit the card banner.')
    const counter = canvas.getByText('20 / 20')
    // one row: the counter starts to the right of the hint and shares its top edge
    const hintBox = hint.getBoundingClientRect()
    const counterBox = counter.getBoundingClientRect()
    await expect(counterBox.left).toBeGreaterThanOrEqual(hintBox.right)
    await expect(Math.abs(counterBox.top - hintBox.top)).toBeLessThan(4)
  },
}

/**
 * Most caption text in the app has no label and no control around it, so the standalone `Hint`
 * renders the same caption without a `<Field>` — where Base UI's parts would throw.
 */
export const Standalone: Story = {
  render: () => (
    <div>
      {/* loose caption: no label, no control — the SortChips / MemeDetail shape */}
      <Hint>Sorting by value needs at least one listing.</Hint>
      {/* a bare label wants phrasing content, so the Trades shape asks for a span */}
      <label>
        Braincells you add
        <Input type="number" defaultValue={12} />
        <Hint as="span">You hold 40.</Hint>
      </label>
      {/* the Create screen wires its help text by hand */}
      <label htmlFor="tags">Tags</label>
      <Input id="tags" aria-describedby="tags-help" placeholder="cat, chaos, monday" />
      <Hint id="tags-help">Up to five, comma separated.</Hint>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Sorting by value needs at least one listing.')).toHaveAttribute(
      'data-slot',
      'hint',
    )
    await expect(canvas.getByText('You hold 40.').tagName).toBe('SPAN')
    await expect(canvas.getByLabelText('Tags')).toHaveAccessibleDescription(
      'Up to five, comma separated.',
    )
  },
}

export const Focused: Story = {
  render: () => (
    <Field>
      <FieldLabel>Braincells you add</FieldLabel>
      <Input type="number" defaultValue={12} />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    await expect(canvas.getByLabelText('Braincells you add')).toHaveFocus()
  },
}

export const Invalid: Story = {
  render: () => (
    <Field invalid>
      <FieldLabel>Shares to give</FieldLabel>
      <Input type="number" defaultValue={99} />
      <FieldError match>You only own 4 shares.</FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const control = canvas.getByLabelText('Shares to give')
    await expect(control).toHaveAttribute('data-invalid')
    await expect(control).toHaveAccessibleDescription('You only own 4 shares.')
    await expect(canvas.getByText('You only own 4 shares.')).toHaveAttribute(
      'data-slot',
      'field-error',
    )
  },
}

/** The label dims with its control, so the pair reads as one disabled thing. */
export const Disabled: Story = {
  render: () => (
    <Field disabled>
      <FieldLabel>Share link</FieldLabel>
      <Input defaultValue="https://memeon.lol/m/meme-holo" />
      <FieldDescription>Available once the mint finishes.</FieldDescription>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Share link')).toBeDisabled()
    await expect(canvas.getByText('Share link')).toHaveAttribute('data-disabled')
  },
}

/** The trade composer's two groups: an intro-size legend over a column of fields. */
export const Grouped: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <FieldSet>
        <FieldLegend>You give</FieldLegend>
        <Field>
          <FieldLabel>Shares to give</FieldLabel>
          <Input type="number" defaultValue={2} />
        </Field>
      </FieldSet>
      <FieldSet>
        <FieldLegend>You get</FieldLegend>
        <Field>
          <FieldLabel>Shares to get</FieldLabel>
          <Input type="number" defaultValue={1} />
        </Field>
      </FieldSet>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('group')).toHaveLength(2)
    const legend = canvas.getByText('You give')
    await expect(legend).toHaveAttribute('data-slot', 'field-legend')
    await expect(legend).toHaveAttribute('data-variant', 'legend')
    await expect(canvas.getByRole('group', { name: 'You give' })).toHaveAttribute(
      'data-slot',
      'field-set',
    )
  },
}

/** The micro-caps eyebrow, for a group inside a card that already has a heading. */
export const LegendAsLabel: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend variant="label">Visibility</FieldLegend>
      <Field>
        <FieldLabel>Share link</FieldLabel>
        <Input defaultValue="https://memeon.lol/m/meme-holo" />
      </Field>
    </FieldSet>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Visibility')).toHaveAttribute('data-variant', 'label')
  },
}

/** A disabled group disables every control in it. */
export const GroupDisabled: Story = {
  render: () => (
    <FieldSet disabled>
      <FieldLegend>You get</FieldLegend>
      <Field>
        <FieldLabel>Shares to get</FieldLabel>
        <Input type="number" defaultValue={1} />
      </Field>
    </FieldSet>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Shares to get')).toBeDisabled()
  },
}

export const Dark: Story = { ...Invalid, globals: { theme: 'dark' } }
