import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '@/atoms/button'
import {
  Dialog,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/atoms/dialog'
import { PortalAnchor } from '@/atoms/portal-anchor'
import { portalAnchor } from '../lib/portalAnchor'

/**
 * The anchor the portal renders into, so the queries below find the dialog where the app would.
 * Passed in `render`, never through `args`: the getter ref resolves to a DOM node, which Storybook
 * cannot serialise.
 */
const ANCHOR = 'dialog-story-anchor'
const onOpenChange = fn()
const onCommit = fn()

/** Always open, portalled into the canvas. */
function Frame(props: DialogContentProps) {
  return (
    <div className="min-h-80">
      <PortalAnchor id={ANCHOR} />
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent container={portalAnchor(ANCHOR)} {...props}>
          <DialogHeader>
            <DialogTitle>A modal frame</DialogTitle>
            <DialogDescription>Everything the app puts in a modal sits on this box.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="primary" onClick={onCommit}>
              Do it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const meta = {
  title: 'Atoms/Dialog',
  component: DialogContent,
  args: { closeLabel: 'Close the dialog' },
  render: (args) => <Frame {...args} />,
} satisfies Meta<typeof DialogContent>

export default meta
type Story = StoryObj<typeof meta>

/** The 640px frame: Base UI owns modality and focus, this owns the box. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('dialog', { name: 'A modal frame' })
    // the popup stays inside the tree it was written in, so a screen's own canvas query finds it
    await expect(canvasElement.contains(dialog)).toBe(true)
    await expect(dialog).toHaveAttribute('data-slot', 'dialog-content')
    await expect(dialog).toHaveAttribute('data-size', 'md')
    // Base UI never sets it: a screen reader that constrains its cursor by aria-modal needs it
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toHaveAccessibleDescription('Everything the app puts in a modal sits on this box.')
    await expect(canvasElement.querySelector('[data-slot="dialog-overlay"]')).not.toBeNull()
    // the ✕ is in the corner and the header keeps out of its lane
    await expect(canvas.getByRole('button', { name: 'Close the dialog' })).toHaveAttribute('data-slot', 'dialog-close')
    const header = canvasElement.querySelector<HTMLElement>('[data-slot="dialog-header"]')!
    await expect(getComputedStyle(header).paddingRight).toBe('48px')
    // Base UI moves focus on the next frame, so this is a wait, not a read
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  },
}

/** The ✕ and Escape both arrive as `onOpenChange(false, details)`; the caller decides. */
export const CloseButton: Story = {
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Close the dialog' }))
    await expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
    onOpenChange.mockClear()
    await userEvent.keyboard('{Escape}')
    await expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  },
}

/** No ✕: the action row is the only way out, and the header takes the full width. */
export const WithoutCloseButton: Story = {
  args: { showCloseButton: false },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="dialog-close"]')).toBeNull()
    const header = canvasElement.querySelector<HTMLElement>('[data-slot="dialog-header"]')!
    await expect(getComputedStyle(header).paddingRight).toBe('0px')
  },
}

/** The 440px confirm frame wearing the danger ring inside the card, over the modal shadow. */
export const Danger: Story = {
  args: { size: 'sm', variant: 'danger', showCloseButton: false },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog')
    await expect(dialog).toHaveAttribute('data-size', 'sm')
    await expect(dialog).toHaveAttribute('data-variant', 'danger')
    await expect(getComputedStyle(dialog).boxShadow).toContain('inset')
  },
}

/** Under the 720px cut the box becomes a bottom sheet; at this width it is the centred card. */
export const Sheet: Story = {
  args: { sheet: true },
}

/** Taller than the frame allows: the box scrolls, the viewport does not. */
export const Scrolling: Story = {
  render: (args) => (
    <div className="min-h-80">
      <PortalAnchor id={ANCHOR} />
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent container={portalAnchor(ANCHOR)} {...args}>
          <DialogHeader>
            <DialogTitle>A long explanation</DialogTitle>
          </DialogHeader>
          {Array.from({ length: 30 }, (_, index) => (
            <p key={index} className="m-0 text-sm text-muted-foreground">
              Line {index + 1} of a very long explanation.
            </p>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  ),
}

/** Uncontrolled: the trigger opens it, Escape closes it, focus returns to the trigger. */
export const Triggered: Story = {
  render: (args) => (
    <div className="min-h-80">
      <Dialog>
        <DialogTrigger>Open the dialog</DialogTrigger>
        <PortalAnchor id={ANCHOR} />
        <DialogContent container={portalAnchor(ANCHOR)} {...args}>
          <DialogHeader>
            <DialogTitle>Opened by its trigger</DialogTitle>
            <DialogDescription>Base UI restores focus to the trigger on the way out.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Open the dialog' })
    await expect(canvas.queryByRole('dialog')).toBeNull()
    await userEvent.click(trigger)
    const dialog = await canvas.findByRole('dialog', { name: 'Opened by its trigger' })
    await expect(canvasElement.contains(dialog)).toBe(true)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull())
    await expect(trigger).toHaveFocus()
  },
}

export const Dark: Story = { ...Danger, globals: { theme: 'dark' } }
