import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Field, FieldLabel } from './Field'
import { Input } from './Input'

const meta = {
  title: 'Atoms/Input',
  component: Input,
  args: { 'aria-label': 'Title' },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultValue: 'chrome streak' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Title')
    await expect(input).toHaveAttribute('data-slot', 'input')
    await userEvent.type(input, '!')
    await expect(input).toHaveValue('chrome streak!')
  },
}

/** The placeholder reads at regular weight so it never passes for a filled value. */
export const Placeholder: Story = { args: { placeholder: 'cat, chaos, monday' } }

export const Search: Story = {
  args: { type: 'search', 'aria-label': 'Search memes', placeholder: 'Search memes' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('searchbox', { name: 'Search memes' })).toBeVisible()
  },
}

export const Number: Story = {
  args: { type: 'number', 'aria-label': 'Shares', defaultValue: 4, style: { width: 90 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('spinbutton', { name: 'Shares' })).toHaveValue(4)
  },
}

export const Focused: Story = {
  args: { defaultValue: 'chrome streak' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    await expect(canvas.getByLabelText('Title')).toHaveFocus()
  },
}

export const Disabled: Story = {
  args: { defaultValue: 'chrome streak', disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Title')).toBeDisabled()
  },
}

/** `invalid` is the Field's state, never a prop on the control. */
export const Invalid: Story = {
  render: () => (
    <Field invalid>
      <FieldLabel>Title</FieldLabel>
      <Input defaultValue="" />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Title')).toHaveAttribute('data-invalid')
  },
}
