import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Button } from '@/atoms/button'
import { FilterBar, PageHead } from '@/atoms/page-head'
import { Toolbar } from '@/atoms/toolbar'

const meta = {
  title: 'Atoms/PageHead',
  component: PageHead,
  args: { title: 'Marketplace' },
} satisfies Meta<typeof PageHead>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithSubtitle: Story = {
  args: { title: 'Top Brains', subtitle: 'Updated hourly' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Updated hourly')).toBeInTheDocument()
  },
}

/** Heading-level agnostic: promoting the title to <h1> costs nothing. */
export const AsH1: Story = {
  args: { title: 'Mint a meme', level: 'h1' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Mint a meme' })).toBeInTheDocument()
  },
}

export const WithFilterBar: Story = {
  args: {
    children: (
      <FilterBar>
        <Button>Cancel</Button>
        <Button variant="primary">Save</Button>
      </FilterBar>
    ),
  },
}

/** `Toolbar` is what the FilterBar sites become; the head gives it the same slack. */
export const WithToolbar: Story = {
  args: {
    children: (
      <Toolbar>
        <Button>Cancel</Button>
        <Button variant="primary">Save</Button>
      </Toolbar>
    ),
  },
  play: async ({ canvasElement }) => {
    const head = canvasElement.querySelector<HTMLElement>('[data-slot="page-head"]')!
    const toolbar = head.querySelector<HTMLElement>(':scope > [data-slot="toolbar"]')
    /* the slack rule keys off a *direct* child slot; the `lg:` arm is a viewport question */
    await expect(toolbar).not.toBeNull()
  },
}

export const Dark: Story = { ...WithSubtitle, globals: { theme: 'dark' } }
