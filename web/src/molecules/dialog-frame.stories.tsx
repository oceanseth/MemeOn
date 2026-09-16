import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '@/atoms/button'
import { DialogFooter } from '@/atoms/dialog'
import { DialogFrame } from '@/molecules/dialog-frame'

const onOpenChange = fn()

const actions = (
  <DialogFooter>
    <Button>Cancel</Button>
    <Button variant="primary">Do it</Button>
  </DialogFooter>
)

const meta = {
  title: 'Molecules/DialogFrame',
  component: DialogFrame,
  args: {
    id: 'frame-story',
    open: true,
    onOpenChange,
    title: 'A modal frame',
    description: 'Everything the app puts in a modal sits on this box.',
    children: actions,
  },
} satisfies Meta<typeof DialogFrame>

export default meta
type Story = StoryObj<typeof meta>

const token = (name: string) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))

/** The 640px frame: Base UI owns modality and focus, the atom owns the box, this the contract. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('dialog', { name: 'A modal frame' })
    // the popup stays inside the tree it was written in, so a screen's own canvas query finds it
    await expect(canvasElement.contains(dialog)).toBe(true)
    await expect(dialog).toHaveAttribute('data-slot', 'dialog')
    await expect(dialog).toHaveAttribute('data-size', 'md')
    await expect(dialog).toHaveAttribute('data-variant', 'default')
    await expect(dialog).toHaveAttribute('aria-describedby', 'frame-story-description')
    // Base UI never sets it: a screen reader that constrains its cursor by aria-modal needs it
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(canvasElement.querySelector('[data-slot="dialog-overlay"]')).not.toBeNull()
    await expect(canvasElement.querySelector('[data-slot="dialog-footer"]')).not.toBeNull()
    // no ✕ asked for: none rendered, and the header keeps the full width
    await expect(canvasElement.querySelector('[data-slot="dialog-close"]')).toBeNull()
    const header = canvasElement.querySelector<HTMLElement>('[data-slot="dialog-header"]')!
    await expect(getComputedStyle(header).paddingRight).toBe('0px')
    // Base UI moves focus on the next frame, so this is a wait, not a read
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  },
}

/** With the ✕ exit: the icon button in the corner, and the title row reserves its lane. */
export const WithClose: Story = {
  args: { close: { label: 'Close the frame' } },
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear()
    const canvas = within(canvasElement)
    const close = canvas.getByRole('button', { name: 'Close the frame' })
    await expect(close).toHaveAttribute('data-slot', 'dialog-close')
    await expect(close.offsetHeight).toBe(token('--spacing-control-sm'))
    const header = canvasElement.querySelector<HTMLElement>('[data-slot="dialog-header"]')!
    await expect(getComputedStyle(header).paddingRight).toBe('48px')
    await userEvent.click(close)
    await expect(onOpenChange).toHaveBeenCalledWith(false)
  },
}

/** A locked frame: the ✕ says it is not an exit right now, instead of looking operable. */
export const CloseLocked: Story = {
  args: { close: { label: 'Close the frame', disabled: true } },
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear()
    const close = within(canvasElement).getByRole('button', { name: 'Close the frame' })
    await expect(close).toBeDisabled()
    await userEvent.click(close)
    await expect(onOpenChange).not.toHaveBeenCalled()
  },
}

/** Escape is Base UI's, not the platform's: a synthetic key event reaches it. */
export const EscapeDismisses: Story = {
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear()
    within(canvasElement).getByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await expect(onOpenChange).toHaveBeenCalledWith(false)
  },
}

/** The 440px confirm frame, wearing the danger ring inside the card, over the modal shadow. */
export const DangerAlert: Story = {
  args: {
    size: 'sm',
    role: 'alertdialog',
    danger: true,
    title: '⚠️ Delete forever?',
    description: "This can't be undone.",
  },
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alertdialog')
    // the atom fades in, so visibility is a wait, not a read
    await waitFor(() => expect(alert).toBeVisible())
    await expect(alert).toHaveAttribute('aria-modal', 'true')
    await expect(alert).toHaveAttribute('data-size', 'sm')
    await expect(alert).toHaveAttribute('data-variant', 'danger')
    await expect(getComputedStyle(alert).boxShadow).toContain('inset')
  },
}

/** Taller than the frame allows: the box scrolls, the viewport does not. */
export const Scrolling: Story = {
  args: {
    children: (
      <>
        {Array.from({ length: 30 }, (_, index) => (
          <p key={index} className="m-0 text-sm text-muted-foreground">
            Line {index + 1} of a very long explanation.
          </p>
        ))}
        {actions}
      </>
    ),
  },
}

export const Closed: Story = {
  args: { open: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('dialog')).toBeNull()
    // closed is unmounted, not hidden: the scrim is gone in the same commit
    await expect(canvasElement.querySelector('[data-slot="dialog-overlay"]')).toBeNull()
    await expect(canvasElement.querySelector('[data-slot="portal-anchor"]')).not.toBeNull()
  },
}

/** The danger frame on the dark arm: the 2px error ring sits inside the card, over the modal shadow. */
export const Dark: Story = { ...DangerAlert, globals: { theme: 'dark' } }
