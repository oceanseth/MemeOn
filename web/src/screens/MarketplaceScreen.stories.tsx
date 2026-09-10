import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { marketplacePage } from '../../.storybook/fixtures'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { buildSortChipsModel } from '../lib/sortChipsModel'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { MarketplaceScreen } from './MarketplaceScreen'

const SORT_REASON = "Newest first — the market can't rank by views, reshares or value yet."

const empty: MarketplaceScreenModel = {
  phase: 'empty', cards: [],
  queryInputProps: {
    value: '', placeholder: 'Search memes or tags',
    'aria-label': 'Search memes, tags and creators', onChange: fn(),
  },
  typeSelectProps: { value: '', 'aria-label': 'Filter by media type', onValueChange: fn() },
  tierSelectProps: { value: '', 'aria-label': 'Filter by tier', onValueChange: fn() },
  listedInputProps: { checked: false, onCheckedChange: fn() },
  sortChips: buildSortChipsModel({
    sortKey: 'new', dir: 'desc', onChange: fn(), disabledReason: SORT_REASON,
  }),
  createLinkProps: { to: '/binder/new' },
  filtersToggleProps: { onClick: fn(), 'aria-expanded': false, 'aria-controls': 'market-filters' },
  filtersToggleLabel: 'Filters',
  filtersPanelProps: { id: 'market-filters', 'data-collapsed': 'true' },
  statusProps: { role: 'status', 'aria-live': 'polite' },
  resultsLabel: 'Nothing matches',
  clearFiltersProps: null,
  showLoading: false, showEmpty: true, showError: false, showGrid: false, showMore: false,
  skeletonCount: 8,
  errorMessage: "Couldn't reach the market. Your filters are still set.",
  retryButtonProps: { onClick: fn(), disabled: false },
  retryLabel: 'Try again',
  loadMoreProps: { onClick: fn(), disabled: false, 'aria-busy': false },
  loadMoreLabel: 'Load more',
  loadMoreError: null,
  endOfListLabel: null,
}
const ready: Partial<MarketplaceScreenModel> = {
  phase: 'ready', cards: marketplacePage.map(buildMemeCardModel),
  showEmpty: false, showGrid: true, resultsLabel: `${marketplacePage.length} memes`,
}
const meta = { title: 'Screens/MarketplaceScreen', component: MarketplaceScreen, args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof MarketplaceScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Loading: Story = {
  args: {
    phase: 'loading', showLoading: true, showEmpty: false, showGrid: false,
    resultsLabel: 'Searching the market…',
  },
}
export const Empty: Story = {}
export const Error: Story = {
  args: {
    phase: 'error', showEmpty: false, showError: true, resultsLabel: 'No memes loaded',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(/Couldn't reach the market/)
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  },
}
export const Ready: Story = {
  args: { ...ready, endOfListLabel: "That's every meme matching these filters." },
}
export const ReadyWithMore: Story = { args: { ...ready, showMore: true } }
export const LoadMoreFailed: Story = {
  args: {
    ...ready, showMore: true, loadMoreLabel: 'Try again',
    loadMoreError: "Couldn't pull the next page.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(/next page/)
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeEnabled()
  },
}
/** Phone disclosure: the sticky row keeps search and the mint CTA, filters open on demand. */
export const FiltersNarrowed: Story = {
  args: {
    ...ready,
    typeSelectProps: { value: 'image', 'aria-label': 'Filter by media type', onValueChange: fn() },
    tierSelectProps: { value: 'holo', 'aria-label': 'Filter by tier', onValueChange: fn() },
    listedInputProps: { checked: true, onCheckedChange: fn() },
    filtersToggleLabel: 'Filters · 3',
    filtersToggleProps: { onClick: fn(), 'aria-expanded': true, 'aria-controls': 'market-filters' },
    filtersPanelProps: { id: 'market-filters', 'data-collapsed': 'false' },
    resultsLabel: '2 memes · Images · Holo · for sale',
    clearFiltersProps: { onClick: fn() },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Images · Holo · for sale')
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }))
    await expect(args.clearFiltersProps?.onClick).toHaveBeenCalled()
  },
}
