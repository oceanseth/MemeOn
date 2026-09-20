import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/atoms/dialog'
import { PortalAnchor } from '@/atoms/portal-anchor'
import { portalAnchor } from '../lib/portalAnchor'

const meta = {
  title: 'Atoms/PortalAnchor',
  component: PortalAnchor,
  args: { id: 'portal-anchor-story' },
} satisfies Meta<typeof PortalAnchor>

export default meta
type Story = StoryObj<typeof meta>

/** Idle: `display: contents`, so the anchor costs its row no box and no flex gap. */
export const Idle: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <span>before</span>
      <PortalAnchor {...args} />
      <span>after</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const anchor = canvasElement.querySelector<HTMLElement>('[data-slot="portal-anchor"]')!
    await expect(anchor).not.toBeNull()
    await expect(anchor.id).toBe('portal-anchor-story')
    await expect(getComputedStyle(anchor).display).toBe('contents')
    // the getter ref resolves the same element, with no hook and no ref plumbing
    await expect(portalAnchor('portal-anchor-story').current).toBe(anchor)
    await expect(portalAnchor('no-such-anchor').current).toBeNull()
  },
}

/** Hosting: a dialog portalled into the anchor stays inside the canvas, where `within(canvasElement)` finds it. */
export const HostingADialog: Story = {
  render: (args) => (
    <div className="min-h-80">
      <PortalAnchor {...args} />
      <Dialog open>
        <DialogContent container={portalAnchor(args.id)} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Inside the canvas</DialogTitle>
            <DialogDescription>
              The portal renders into the anchor, not into the body.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const dialog = canvas.getByRole('dialog', { name: 'Inside the canvas' })
    const anchor = canvasElement.querySelector('[data-slot="portal-anchor"]')!
    await expect(anchor.contains(dialog)).toBe(true)
  },
}

export const Dark: Story = { ...HostingADialog, globals: { theme: 'dark' } }
