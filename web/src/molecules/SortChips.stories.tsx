import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { buildSortChipsModel } from '../lib/sortChipsModel'
import { SortChips } from './SortChips'

const onNewestChange = fn()
const onViewsChange = fn()

const meta = {
  title: 'Molecules/SortChips',
  component: SortChips,
  args: {
    model: buildSortChipsModel({ sortKey: 'new', dir: 'desc', onChange: onNewestChange }),
  },
} satisfies Meta<typeof SortChips>

export default meta
type Story = StoryObj<typeof meta>

export const NewestDesc: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const newest = canvas.getByRole('button', { name: 'Newest↓' })
    await expect(newest).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(newest)
    await expect(onNewestChange).toHaveBeenCalledWith('new', 'asc')
  },
}
export const ViewsAsc: Story = {
  args: {
    model: buildSortChipsModel({ sortKey: 'views', dir: 'asc', onChange: onViewsChange }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: '👁️ Views↑' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(canvas.getByRole('button', { name: '🧠 Value' }))
    await expect(onViewsChange).toHaveBeenCalledWith('value', 'desc')
  },
}
