import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import { ConfirmDialog } from './ConfirmDialog'

const onConfirm = fn()
const onCancel = fn()
const baseInput = {
  open: true,
  id: 'confirm-story',
  title: 'Delete forever?',
  message: "This can't be undone.",
  confirmLabel: 'Delete it',
  onConfirm,
  onCancel,
}

const meta = {
  title: 'Molecules/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    model: buildConfirmDialogModel(baseInput),
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({ canvasElement }) => {
    onCancel.mockClear()
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('alertdialog', { name: 'Delete forever?' })
    // Base UI supplies containment and initial focus: the first control inside the dialog
    await expect(dialog.contains(document.activeElement)).toBe(true)
    await userEvent.click(canvas.getByRole('heading', { name: 'Delete forever?' }))
    await expect(onCancel).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(onCancel).toHaveBeenCalledOnce()
    // Escape is Base UI's own dismissal now, not the platform close watcher, so it answers a
    // synthetic key event and can finally be covered here.
    await userEvent.keyboard('{Escape}')
    await expect(onCancel).toHaveBeenCalledTimes(2)
  },
}
export const Closed: Story = {
  args: { model: buildConfirmDialogModel({ ...baseInput, open: false }) },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('alertdialog')).toBeNull()
  },
}
export const Danger: Story = {
  args: { model: buildConfirmDialogModel({ ...baseInput, danger: true }) },
}
export const Busy: Story = {
  args: { model: buildConfirmDialogModel({ ...baseInput, danger: true, busy: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    const confirm = canvas.getByRole('button', { name: 'Working…' })
    await expect(confirm).toHaveAttribute('aria-busy', 'true')
    await expect(confirm).toHaveAttribute('aria-disabled', 'true')
    await expect(confirm).toBeEnabled()
  },
}
export const Prompt: Story = {
  args: {
    model: buildConfirmDialogModel({
      ...baseInput,
      id: 'claim-story',
      title: 'Claim this meme?',
      message: 'This card is sitting in the archive. Tell us why it belongs to you and we’ll take a look.',
      confirmLabel: 'File the claim',
      prompt: {
        label: 'Why is this meme yours?',
        value: '',
        placeholder: 'the original post, your handle, anything that proves it',
        maxLength: 400,
        hint: 'Links help your case.',
        onChange: fn(),
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: /Why is this meme yours/ })).toHaveAttribute('maxlength', '400')
  },
}
