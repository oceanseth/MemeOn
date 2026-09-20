import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/atoms/collapsible'

const onOpenChange = fn()

const meta = {
  title: 'Atoms/Collapsible',
  component: Collapsible,
  args: { onOpenChange },
  render: (args) => (
    <Collapsible variant="card" {...args} className="w-96">
      <CollapsibleTrigger variant="card">
        <span
          aria-hidden="true"
          className="shrink-0 text-base text-muted-foreground transition-lift group-data-panel-open:rotate-180"
        >
          ▾
        </span>
        <span className="text-lg font-semibold text-foreground">How do shares work?</span>
      </CollapsibleTrigger>
      <CollapsibleContent variant="card">
        Every meme mints a fixed number of shares; a reshare moves one to the resharer.
      </CollapsibleContent>
    </Collapsible>
  ),
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

/** Closed: the panel is out of the DOM; a press mounts it and Base UI marks every part. */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    onOpenChange.mockClear()
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'How do shares work?' })
    await expect(trigger).toHaveAttribute('data-slot', 'collapsible-trigger')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByText(/fixed number of shares/)).toBeNull()
    const root = canvasElement.querySelector('[data-slot="collapsible"]')!
    await expect(root).toHaveAttribute('data-closed')
    await userEvent.click(trigger)
    await expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything())
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
    await expect(trigger).toHaveAttribute('data-panel-open')
    await expect(root).toHaveAttribute('data-open')
    const panel = canvas.getByText(/fixed number of shares/)
    await expect(panel).toHaveAttribute('data-slot', 'collapsible-content')
    await expect(panel).toBeVisible()
  },
}

export const DefaultOpen: Story = {
  args: { defaultOpen: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'How do shares work?' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await expect(canvas.getByText(/fixed number of shares/)).toBeVisible()
  },
}

/** The `card` variant paints all three parts, so a composition never paints through `render`. */
export const CardVariant: Story = {
  args: { defaultOpen: true },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="collapsible"]')!
    await expect(root).toHaveAttribute('data-variant', 'card')
    await expect(getComputedStyle(root).borderTopLeftRadius).toBe('24px')
  },
}

export const Dark: Story = { ...DefaultOpen, globals: { theme: 'dark' } }
