import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Field, FieldHint, FieldLabel } from './Field'
import { Fieldset, FieldsetLegend } from './Fieldset'
import { Input } from './Input'

const meta = {
  title: 'Atoms/Fieldset',
  component: Fieldset,
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Fieldset>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Fieldset>
      <FieldsetLegend>You give</FieldsetLegend>
      <Field>
        <FieldLabel>Braincells you add</FieldLabel>
        <Input type="number" defaultValue={12} />
        <FieldHint>You hold 340.</FieldHint>
      </Field>
    </Fieldset>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: 'You give' })).toBeVisible()
  },
}

export const TwoGroups: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Fieldset>
        <FieldsetLegend>You give</FieldsetLegend>
        <Field>
          <FieldLabel>Shares to give</FieldLabel>
          <Input type="number" defaultValue={2} />
        </Field>
      </Fieldset>
      <Fieldset>
        <FieldsetLegend>You want</FieldsetLegend>
        <Field>
          <FieldLabel>Shares to get</FieldLabel>
          <Input type="number" defaultValue={1} />
        </Field>
      </Fieldset>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('group')).toHaveLength(2)
  },
}

export const Disabled: Story = {
  render: () => (
    <Fieldset disabled>
      <FieldsetLegend>You want</FieldsetLegend>
      <Field>
        <FieldLabel>Shares to get</FieldLabel>
        <Input type="number" defaultValue={1} />
      </Field>
    </Fieldset>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('Shares to get')).toBeDisabled()
  },
}
