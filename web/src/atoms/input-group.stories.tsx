import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Field, FieldLabel } from '@/atoms/field'
import { Icon } from '@/atoms/icon'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/atoms/input-group'

const meta = {
  title: 'Atoms/InputGroup',
  component: InputGroup,
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

/** The market's search well: a glyph inside the recess, the control chromeless beside it. */
export const Search: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <Icon name="magnifying-glass" size={20} />
      </InputGroupAddon>
      <InputGroupInput type="search" aria-label="Search memes" placeholder="Search memes" />
    </InputGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="input-group"]')!
    const input = canvas.getByRole('searchbox', { name: 'Search memes' })
    await expect(input).toHaveAttribute('data-slot', 'input-group-control')
    // the group is the well: 50 tall, the control fills it without a second relief
    // (`shadow-none` leaves Tailwind's transparent ring slots in place, so every shadow is a no-op)
    await expect(group.offsetHeight).toBe(50)
    await expect(getComputedStyle(group).boxShadow).not.toBe('none')
    await expect(getComputedStyle(input).boxShadow).toMatch(
      /^(none|(rgba\(0, 0, 0, 0\) 0px 0px 0px 0px(, )?)+)$/,
    )
    // a click on the glyph lands in the control
    await userEvent.click(canvasElement.querySelector('[data-slot="input-group-addon"]')!)
    await expect(input).toHaveFocus()
  },
}

/** A unit after the value. */
export const TrailingText: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput type="number" aria-label="Braincells" defaultValue={12} />
      <InputGroupAddon align="inline-end">
        <InputGroupText>
          <Icon name="brain" size={16} />
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('spinbutton', { name: 'Braincells' })).toHaveValue(12)
    await expect(canvasElement.querySelector('[data-slot="input-group-addon"]')).toHaveAttribute(
      'data-align',
      'inline-end',
    )
  },
}

/** Inside a Field the group inherits the label and the invalid state, and rings as one. */
export const InField: Story = {
  render: () => (
    <Field invalid>
      <FieldLabel>Search memes</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <Icon name="magnifying-glass" size={20} />
        </InputGroupAddon>
        <InputGroupInput type="search" />
      </InputGroup>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Search memes')).toHaveAttribute('data-invalid')
  },
}

export const Disabled: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <Icon name="magnifying-glass" size={20} />
      </InputGroupAddon>
      <InputGroupInput type="search" aria-label="Search memes" disabled />
    </InputGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('searchbox', { name: 'Search memes' })).toBeDisabled()
  },
}

export const Dark: Story = { ...Search, globals: { theme: 'dark' } }
