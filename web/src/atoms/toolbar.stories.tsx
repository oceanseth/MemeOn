import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Button } from '@/atoms/button'
import { Toolbar, ToolbarEnd, ToolbarStart } from '@/atoms/toolbar'

const meta = {
  title: 'Atoms/Toolbar',
  component: Toolbar,
  decorators: [
    (Story) => (
      <div className="w-full max-w-160 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

/** Two slots: filters at the start, the action at the end, the gutter between them. */
export const Default: Story = {
  render: (args) => (
    <Toolbar {...args}>
      <ToolbarStart>
        <Button pressed>All</Button>
        <Button>Images</Button>
        <Button>Videos</Button>
      </ToolbarStart>
      <ToolbarEnd>
        <Button variant="primary">＋ Mint a meme</Button>
      </ToolbarEnd>
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const toolbar = canvasElement.querySelector<HTMLElement>('[data-slot="toolbar"]')!
    await expect(toolbar).toHaveAttribute('data-align', 'start')
    await expect(getComputedStyle(toolbar).columnGap).toBe('18px')
    const start = canvasElement.querySelector<HTMLElement>('[data-slot="toolbar-start"]')!
    const end = canvasElement.querySelector<HTMLElement>('[data-slot="toolbar-end"]')!
    await expect(getComputedStyle(start).columnGap).toBe('10px')
    // the end slot sits at the far edge of the row
    await expect(end.getBoundingClientRect().right).toBeCloseTo(toolbar.getBoundingClientRect().right, 0)
    await expect(within(canvasElement).getAllByRole('button')).toHaveLength(4)
  },
}

/** A single slot pushed to the end: the dialog action row. */
export const AlignEnd: Story = {
  args: { align: 'end' },
  render: (args) => (
    <Toolbar {...args}>
      <Button>Cancel</Button>
      <Button variant="primary">Do it</Button>
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const toolbar = canvasElement.querySelector<HTMLElement>('[data-slot="toolbar"]')!
    await expect(toolbar).toHaveAttribute('data-align', 'end')
    await expect(getComputedStyle(toolbar).justifyContent).toBe('flex-end')
  },
}

/** Children spread across the row. */
export const AlignBetween: Story = {
  args: { align: 'between' },
  render: (args) => (
    <Toolbar {...args}>
      <span className="text-label text-muted-foreground">12 cards</span>
      <Button>Sort</Button>
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const toolbar = canvasElement.querySelector<HTMLElement>('[data-slot="toolbar"]')!
    await expect(getComputedStyle(toolbar).justifyContent).toBe('space-between')
  },
}

/** `stack`: under the 720px cut the slots sit one above the other; at this width, still a row. */
export const Stacked: Story = {
  args: { stack: true },
  render: (args) => (
    <Toolbar {...args}>
      <ToolbarStart>
        <Button>Newest</Button>
        <Button>Views</Button>
      </ToolbarStart>
      <ToolbarEnd>
        <Button variant="primary">Propose a trade</Button>
      </ToolbarEnd>
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="toolbar"]')).not.toBeNull()
  },
}

export const Dark: Story = { ...Default, globals: { theme: 'dark' } }
