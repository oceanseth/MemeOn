import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../atoms/Button'
import { FilterBar } from '../atoms/PageHead'
import { DialogFrame } from './DialogFrame'

const onOpenChange = fn()

const actions = (
  <FilterBar className="mt-[18px] justify-end">
    <Button>Cancel</Button>
    <Button variant="primary">Do it</Button>
  </FilterBar>
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

/** The 640px frame: Base UI owns modality and focus, this owns the box. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('dialog', { name: 'A modal frame' })
    // the popup stays inside the tree it was written in, so a screen's own canvas query finds it
    await expect(canvasElement.contains(dialog)).toBe(true)
    await expect(dialog).toHaveAttribute('aria-describedby', 'frame-story-description')
    await expect(dialog.contains(document.activeElement)).toBe(true)
  },
}

/** With the ✕ exit: absolutely placed, 44px of target, and the title row reserves its slot. */
export const WithClose: Story = {
  args: { close: { label: 'Close the frame' } },
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Close the frame' }))
    await expect(onOpenChange).toHaveBeenCalledWith(false)
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

/** The 440px confirm frame, wearing the danger hairline. */
export const DangerAlert: Story = {
  args: {
    size: 'sm',
    role: 'alertdialog',
    danger: true,
    title: '⚠️ Delete forever?',
    description: "This can't be undone.",
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alertdialog')).toBeVisible()
  },
}

/** Taller than the frame allows: the box scrolls, the viewport does not. */
export const Scrolling: Story = {
  args: {
    children: (
      <>
        {Array.from({ length: 30 }, (_, index) => (
          <p key={index} className="mt-2 text-sm text-text-dim">
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
  },
}
