import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Field, FieldCounter, FieldError, FieldHint, FieldLabel } from './Field'
import { Input } from './Input'

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
    await expect(canvas.getByLabelText('Share link')).toHaveValue(
      'https://memeon.lol/m/meme-holo',
    )
  },
}

export const WithHint: Story = {
  render: () => (
    <Field>
      <FieldLabel>Tags</FieldLabel>
      <Input placeholder="cat, chaos, monday" />
      <FieldHint>Up to five, comma separated.</FieldHint>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Tags')).toHaveAccessibleDescription(
      'Up to five, comma separated.',
    )
  },
}

/** The counter and the help line together: the row the Create screen puts under a capped input. */
export const WithCounter: Story = {
  render: () => (
    <Field>
      <FieldLabel>Title</FieldLabel>
      <Input defaultValue="chrome streak" />
      <FieldCounter>13 / 20</FieldCounter>
      <FieldHint>Twenty characters, so the card never truncates it.</FieldHint>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('13 / 20')).toBeVisible()
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
  },
}

export const Disabled: Story = {
  render: () => (
    <Field disabled>
      <FieldLabel>Share link</FieldLabel>
      <Input defaultValue="https://memeon.lol/m/meme-holo" />
      <FieldHint>Available once the mint finishes.</FieldHint>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Share link')).toBeDisabled()
  },
}
