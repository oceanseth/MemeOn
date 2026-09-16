import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  type AlertDialogContentProps,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/atoms/alert-dialog'
import { PortalAnchor } from '@/atoms/portal-anchor'
import { portalAnchor } from '../lib/portalAnchor'

/**
 * The anchor the portal renders into, so the queries below find the dialog where the app would.
 * Passed in `render`, never through `args`: the getter ref resolves to a DOM node, which Storybook
 * cannot serialise.
 */
const ANCHOR = 'alert-dialog-story-anchor'
const onOpenChange = fn()
const onConfirm = fn()

/** Always open, portalled into the canvas. */
function Frame({ media, ...props }: AlertDialogContentProps & { media?: boolean }) {
  return (
    <div className="min-h-80">
      <PortalAnchor id={ANCHOR} />
      <AlertDialog open onOpenChange={onOpenChange}>
        <AlertDialogContent container={portalAnchor(ANCHOR)} {...props}>
          <AlertDialogHeader>
            {media && <AlertDialogMedia aria-hidden="true">🗑️</AlertDialogMedia>}
            <AlertDialogTitle>Delete forever?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const meta = {
  title: 'Atoms/AlertDialog',
  component: AlertDialogContent,
  render: (args) => <Frame {...args} />,
} satisfies Meta<typeof AlertDialogContent>

export default meta
type Story = StoryObj<typeof meta>

/** The 440px confirm frame: Base UI gives it the alertdialog role, this the box and the two buttons. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear()
    onConfirm.mockClear()
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('alertdialog', { name: 'Delete forever?' })
    await expect(canvasElement.contains(dialog)).toBe(true)
    await expect(dialog).toHaveAttribute('data-slot', 'alert-dialog-content')
    await expect(dialog).toHaveAttribute('data-size', 'sm')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toHaveAccessibleDescription("This can't be undone.")
    const cancel = canvas.getByRole('button', { name: 'Keep it' })
    await expect(cancel).toHaveAttribute('data-slot', 'alert-dialog-cancel')
    // the cancel wears the Button pill: 46px tall, the control radius
    await expect(cancel.offsetHeight).toBe(46)
    await userEvent.click(canvas.getByRole('button', { name: 'Delete' }))
    await expect(onConfirm).toHaveBeenCalledTimes(1)
    await userEvent.click(cancel)
    await expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  },
}

/** A glyph in a well above the title. */
export const WithMedia: Story = {
  render: (args) => <Frame {...args} media />,
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="alert-dialog-media"]')).not.toBeNull()
  },
}

/** The danger ring inside the card, over the modal shadow. */
export const Danger: Story = {
  args: { variant: 'danger' },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('alertdialog')
    await expect(dialog).toHaveAttribute('data-variant', 'danger')
    await expect(getComputedStyle(dialog).boxShadow).toContain('inset')
  },
}

/** The wider frame, and a bottom sheet under the 720px cut. */
export const MediumSheet: Story = {
  args: { size: 'md', sheet: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alertdialog')).toHaveAttribute('data-size', 'md')
  },
}

/** Uncontrolled: the trigger opens it; Escape does not close an alert dialog, Cancel does. */
export const Triggered: Story = {
  render: (args) => (
    <div className="min-h-80">
      <AlertDialog>
        <AlertDialogTrigger>Delete the meme</AlertDialogTrigger>
        <PortalAnchor id={ANCHOR} />
        <AlertDialogContent container={portalAnchor(ANCHOR)} {...args}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete forever?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Delete the meme' })
    await userEvent.click(trigger)
    const dialog = await canvas.findByRole('alertdialog', { name: 'Delete forever?' })
    await expect(canvasElement.contains(dialog)).toBe(true)
    await userEvent.click(canvas.getByRole('button', { name: 'Keep it' }))
    await waitFor(() => expect(canvas.queryByRole('alertdialog')).toBeNull())
    await expect(trigger).toHaveFocus()
  },
}

export const Dark: Story = { ...Danger, globals: { theme: 'dark' } }
