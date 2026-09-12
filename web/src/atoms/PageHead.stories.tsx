import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Button } from './Button'
import { FilterBar, PageHead } from './PageHead'

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

export const Dark: Story = { ...WithSubtitle, globals: { theme: 'dark' } }
