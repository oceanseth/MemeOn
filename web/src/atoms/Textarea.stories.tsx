import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Field, FieldError, FieldHint, FieldLabel } from './Field'
import { Textarea } from './Textarea'

const meta = {
  title: 'Atoms/Textarea',
  component: Textarea,
  args: { 'aria-label': 'Prompt', rows: 4 },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultValue: 'a cat wearing chrome sunglasses' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = canvas.getByLabelText('Prompt')
    await expect(textarea).toHaveAttribute('data-slot', 'textarea')
    await expect(textarea).toHaveAttribute('rows', '4')
    await userEvent.type(textarea, ', neon')
    await expect(textarea).toHaveValue('a cat wearing chrome sunglasses, neon')
  },
}

export const Placeholder: Story = { args: { placeholder: 'Describe the meme you want…' } }

export const Disabled: Story = {
  args: { defaultValue: 'a cat wearing chrome sunglasses', disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Prompt')).toBeDisabled()
  },
}

export const InField: Story = {
  render: () => (
    <Field>
      <FieldLabel>Why are you reporting this?</FieldLabel>
      <Textarea rows={3} placeholder="Optional" />
      <FieldHint>A moderator reads every report.</FieldHint>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByLabelText('Why are you reporting this?'),
    ).toHaveAccessibleDescription('A moderator reads every report.')
  },
}

export const Invalid: Story = {
  render: () => (
    <Field invalid>
      <FieldLabel>Why are you reporting this?</FieldLabel>
      <Textarea rows={3} />
      <FieldError match>Tell us what happened first.</FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Why are you reporting this?')).toHaveAttribute(
      'data-invalid',
    )
  },
}

export const Dark: Story = { ...Default, globals: { theme: 'dark' } }
