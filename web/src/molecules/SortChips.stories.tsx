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
    const newest = canvas.getByRole('button', { name: 'Newest, descending' })
    await expect(newest).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('group', { name: 'Sort by' })).toBeInTheDocument()
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
    await expect(canvas.getByRole('button', { name: '👁️ Views, ascending' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(canvas.getByRole('button', { name: '🧠 Value' }))
    await expect(onViewsChange).toHaveBeenCalledWith('value', 'desc')
  },
}
/** The market can only page newest-first, so the row says so instead of ranking a sample. */
export const RankingUnavailable: Story = {
  args: {
    model: buildSortChipsModel({
      sortKey: 'new',
      dir: 'desc',
      onChange: fn(),
      disabledReason: "Newest first — the market can't rank by views, reshares or value yet.",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: '🧠 Value' })).toBeDisabled()
    await expect(canvas.getByRole('group', { name: 'Sort by' })).toHaveAccessibleDescription(
      /can't rank/,
    )
  },
}

/** The same row on the dark arm: the pressed well still reads as the selected tab. */
export const Dark: Story = {
  args: {
    model: buildSortChipsModel({ sortKey: 'views', dir: 'desc', onChange: fn() }),
  },
  globals: { theme: 'dark' },
}
