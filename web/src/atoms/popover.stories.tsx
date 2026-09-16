import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { PortalAnchor } from '@/atoms/portal-anchor'
import {
  Popover,
  PopoverContent,
  type PopoverContentProps,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/atoms/popover'
import { portalAnchor } from '../lib/portalAnchor'

/**
 * The anchor the portal renders into, so the queries below find the popup where the app would.
 * Passed in `render`, never through `args`: the getter ref resolves to a DOM node, which Storybook
 * cannot serialise.
 */
const ANCHOR = 'popover-story-anchor'
const onOpenChange = fn()

function Demo({ open, ...content }: PopoverContentProps & { open?: boolean | undefined }) {
  return (
    <div className="flex min-h-64 justify-end p-6">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger>Alerts</PopoverTrigger>
        {/* display:contents, so an idle popover costs the row no box and no flex gap */}
        <PortalAnchor id={ANCHOR} />
        <PopoverContent container={portalAnchor(ANCHOR)} {...content}>
          <PopoverHeader>
            <PopoverTitle>Alerts</PopoverTitle>
            <PopoverDescription>Nothing new since you last looked.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  )
}

const meta = {
  title: 'Atoms/Popover',
  component: PopoverContent,
  args: { align: 'end' },
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof PopoverContent>

export default meta
type Story = StoryObj<typeof meta>

/** Open, controlled: the popup is a raised card of the pop material, inside the canvas. */
export const Open: Story = {
  render: (args) => <Demo {...args} open />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const popup = canvas.getByRole('dialog', { name: 'Alerts' })
    await expect(canvasElement.contains(popup)).toBe(true)
    await expect(popup).toHaveAttribute('data-slot', 'popover-content')
    await expect(popup).toHaveAttribute('data-side', 'bottom')
    await expect(popup).toHaveAccessibleDescription('Nothing new since you last looked.')
    await expect(getComputedStyle(popup).boxShadow).not.toBe('none')
    await expect(canvas.getByRole('button', { name: 'Alerts' })).toHaveAttribute('aria-expanded', 'true')
    await expect(canvasElement.querySelector('[data-slot="popover-positioner"]')).not.toBeNull()
  },
}

/** Uncontrolled: the trigger opens it, Escape closes it and returns focus. */
export const Triggered: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Alerts' })
    await expect(canvas.queryByRole('dialog')).toBeNull()
    await userEvent.click(trigger)
    const popup = await canvas.findByRole('dialog', { name: 'Alerts' })
    await expect(canvasElement.contains(popup)).toBe(true)
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull())
    await expect(trigger).toHaveFocus()
  },
}

/** Opening a notification list must not move the caret: `initialFocus={false}` passes to the popup. */
export const KeepsFocusOnTrigger: Story = {
  args: { initialFocus: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Alerts' })
    await userEvent.click(trigger)
    await canvas.findByRole('dialog', { name: 'Alerts' })
    await expect(trigger).toHaveFocus()
  },
}

/** Placed above: the side attribute drives the enter animation's direction. */
export const OnTop: Story = {
  args: { side: 'top' },
  render: (args) => (
    <div className="flex min-h-64 items-end justify-end p-6">
      <Popover open onOpenChange={onOpenChange}>
        <PopoverTrigger>Alerts</PopoverTrigger>
        <PortalAnchor id={ANCHOR} />
        <PopoverContent container={portalAnchor(ANCHOR)} {...args}>
          <PopoverHeader>
            <PopoverTitle>Alerts</PopoverTitle>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('dialog', { name: 'Alerts' })).toHaveAttribute('data-side', 'top')
  },
}

export const Dark: Story = { ...Open, globals: { theme: 'dark' } }
