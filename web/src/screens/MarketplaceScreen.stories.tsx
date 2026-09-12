import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { marketplacePage } from '../../.storybook/fixtures'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { buildSortChipsModel } from '../lib/sortChipsModel'
import { buildMarketFilterTabs, type MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { MarketplaceScreen } from './MarketplaceScreen'

const SORT_REASON = "Newest first — the market can't rank by views, reshares or value yet."

const empty: MarketplaceScreenModel = {
  phase: 'empty', cards: [],
  queryInputProps: {
    value: '', placeholder: 'Search memes or tags',
    'aria-label': 'Search memes, tags and creators', onChange: fn(),
  },
  filterTabs: buildMarketFilterTabs({ type: '', listed: false, onTypeChange: fn(), onListedChange: fn() }),
  tierSelectProps: { value: '', 'aria-label': 'Filter by tier', onValueChange: fn() },
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
const onType = fn()
const onListed = fn()
const ready: Partial<MarketplaceScreenModel> = {
  phase: 'ready', cards: marketplacePage.map(buildMemeCardModel),
  showEmpty: false, showGrid: true, resultsLabel: `${marketplacePage.length} memes`,
}
/** 390×844: the phone column — search, the two disclosure pills, the primary Mint, a 2-up grid. */
const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
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
    filterTabs: buildMarketFilterTabs({ type: 'image', listed: true, onTypeChange: fn(), onListedChange: fn() }),
    tierSelectProps: { value: 'holo', 'aria-label': 'Filter by tier', onValueChange: fn() },
    filtersToggleLabel: 'Filters · 3',
    filtersToggleProps: { onClick: fn(), 'aria-expanded': true, 'aria-controls': 'market-filters' },
    filtersPanelProps: { id: 'market-filters', 'data-collapsed': 'false' },
    resultsLabel: '2 memes · Images · Holo · for sale',
    clearFiltersProps: { onClick: fn() },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Images · Holo · for sale')
    // filter row uses pressed tabs — aria-pressed, not a checked box
    const media = within(canvas.getByRole('group', { name: 'Filter by media type' }))
    await expect(media.getByRole('button', { name: 'Images' })).toHaveAttribute('aria-pressed', 'true')
    await expect(media.getByRole('button', { name: 'All memes' })).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByRole('button', { name: 'For sale' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Clear filters' }))
    await expect(args.clearFiltersProps?.onClick).toHaveBeenCalled()
  },
}

/** Every tab spends the model it was handed: single-select media, an independent For sale. */
export const FilterTabsPressAndToggle: Story = {
  args: {
    ...ready,
    filterTabs: buildMarketFilterTabs({
      type: '', listed: false, onTypeChange: onType, onListedChange: onListed,
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const media = within(canvas.getByRole('group', { name: 'Filter by media type' }))
    await expect(media.getByRole('button', { name: 'All memes' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(media.getByRole('button', { name: 'Videos' }))
    await expect(onType).toHaveBeenLastCalledWith('video')
    await userEvent.click(canvas.getByRole('button', { name: 'For sale' }))
    await expect(onListed).toHaveBeenLastCalledWith(true)
    // a 46px pill on a coarse pointer is already past the 44px floor
    await expect(media.getByRole('button', { name: 'Videos' }).getBoundingClientRect().height).toBe(46)
  },
}

/** The dark arm of the whole page: plate, pressed tabs, neutral Mint, tier frames. */
export const Dark: Story = {
  args: { ...ready, endOfListLabel: "That's every meme matching these filters." },
  globals: { theme: 'dark' },
}

/** 390: search, "All memes" pressed beside "Filters", the primary Mint pill, a 2-up grid. */
export const Phone390: Story = {
  args: { ...ready, showMore: true },
  ...phone,
}

export const DarkPhone390: Story = {
  args: Phone390.args,
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}
