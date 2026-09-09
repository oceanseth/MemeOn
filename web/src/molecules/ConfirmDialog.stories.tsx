import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import { ConfirmDialog } from './ConfirmDialog'

const onConfirm = fn()
const onCancel = fn()
const baseInput = {
  open: true,
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
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('alertdialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await userEvent.click(canvas.getByRole('heading', { name: 'Delete forever?' }))
    await expect(onCancel).not.toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(onCancel).toHaveBeenCalledOnce()
  },
}
export const Closed: Story = {
  args: { model: buildConfirmDialogModel({ ...baseInput, open: false }) },
}
export const Danger: Story = {
  args: { model: buildConfirmDialogModel({ ...baseInput, danger: true }) },
}
export const Busy: Story = {
  args: { model: buildConfirmDialogModel({ ...baseInput, busy: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'Working…' })).toBeDisabled()
  },
}
