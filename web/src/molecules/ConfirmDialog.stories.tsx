import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../atoms/Button'
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
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
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
/**
 * A screen opens this dialog from state, not from a `Dialog.Trigger`, so the model records whoever
 * was focused and the frame hands focus back there. The `tabIndex={-1}` wrapper stands in for the
 * `<main>` landmark the app portals into: it is the focusable ancestor a press on the scrim moves
 * focus to, and the reason the restore has to be explicit.
 */
function FocusRestoreHarness() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <div tabIndex={-1}>
      <Button onClick={() => setOpen(true)}>Remove Pal</Button>
      <ConfirmDialog
        model={buildConfirmDialogModel({
          ...baseInput,
          id: 'focus-restore-story',
          open,
          onConfirm: close,
          onCancel: close,
        })}
      />
    </div>
  )
}

export const RestoresFocusToItsOpener: Story = {
  render: () => <FocusRestoreHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const opener = canvas.getByRole('button', { name: 'Remove Pal' })
    const dismissals = {
      scrim: async () => {
        const backdrop = canvasElement.querySelector('[data-slot="dialog-backdrop"]')
        await expect(backdrop).not.toBeNull()
        await userEvent.click(backdrop as HTMLElement)
      },
      escape: () => userEvent.keyboard('{Escape}'),
      cancel: () => userEvent.click(canvas.getByRole('button', { name: 'Cancel' })),
    }

    for (const dismiss of Object.values(dismissals)) {
      await userEvent.click(opener)
      await expect(canvas.getByRole('alertdialog', { name: 'Delete forever?' })).toBeVisible()
      await dismiss()
      await waitFor(() => expect(canvas.queryByRole('alertdialog')).toBeNull())
      await waitFor(() => expect(document.activeElement).toBe(opener))
    }
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

export const Dark: Story = { ...Danger, globals: { theme: 'dark' } }
