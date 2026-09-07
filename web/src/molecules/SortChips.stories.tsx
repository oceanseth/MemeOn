import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SortChips } from './SortChips'

const meta = {
  title: 'Molecules/SortChips',
  component: SortChips,
  args: {
    sortKey: 'new',
    dir: 'desc',
    onChange: fn(),
  },
} satisfies Meta<typeof SortChips>

export default meta
type Story = StoryObj<typeof meta>

export const NewestDesc: Story = {}
export const ViewsAsc: Story = { args: { sortKey: 'views', dir: 'asc' } }
