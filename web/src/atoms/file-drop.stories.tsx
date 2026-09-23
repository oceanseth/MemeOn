import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Field, FieldDescription, FieldLabel } from '@/atoms/field'
import { FileDrop } from '@/atoms/file-drop'

const meta = {
  title: 'Atoms/FileDrop',
  component: FileDrop,
  args: {
    accept: 'image/png,image/jpeg,image/gif,image/webp',
    chooseLabel: 'Choose an image',
    emptyLabel: 'or drop one here',
    fileName: null,
    onFile: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Field>
          <FieldLabel>Image</FieldLabel>
          <Story />
          <FieldDescription>PNG, JPG, GIF or WebP, max 8MB.</FieldDescription>
        </Field>
      </div>
    ),
  ],
} satisfies Meta<typeof FileDrop>

export default meta
type Story = StoryObj<typeof meta>

/** Resting: our pill, our sentence — no user-agent copy anywhere in the row. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Choose an image')).toBeVisible()
    await expect(canvas.getByText('or drop one here')).toBeVisible()
    // the Field's label names the real control, so the picker is reachable by its label
    await expect(canvas.getByLabelText('Image')).toHaveAttribute('type', 'file')
  },
}

/** Picking hands the `File` up; the name comes back down as a prop, in our own type. */
export const Picked: Story = {
  args: { fileName: 'cursed-capybara.png' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('cursed-capybara.png')).toBeVisible()
    await expect(canvas.queryByText('or drop one here')).not.toBeInTheDocument()
    const input = canvas.getByLabelText('Image')
    const file = new File(['x'], 'other.png', { type: 'image/png' })
    await userEvent.upload(input, file)
    await expect(input).toHaveValue('')
    await expect(args.onFile).toHaveBeenCalledTimes(1)
    await userEvent.upload(input, file)
    await expect(args.onFile).toHaveBeenCalledTimes(2)
    await expect(args.onFile).toHaveBeenCalledWith(file)
  },
}

/**
 * The native input stays disabled and the well keeps the not-allowed cursor, but the painted
 * label stays fully opaque. axe exempts a disabled *element* and still scores this div's
 * children, so `--opacity-disabled` would fail them.
 */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText('Image')
    await expect(input).toBeDisabled()
    const well = input.parentElement
    await expect(well).toHaveAttribute('data-slot', 'file-drop')
    await expect(well).toHaveAttribute('data-disabled', 'true')
    await expect(getComputedStyle(well as HTMLElement).opacity).toBe('1')
    await expect(getComputedStyle(well as HTMLElement).cursor).toBe('not-allowed')
  },
}
