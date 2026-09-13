import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { marketplacePage } from '../../.storybook/fixtures'
import { marketplaceCopy as copy } from '../copy/marketplace'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { buildSortChipsModel } from '../lib/sortChipsModel'
import { buildMarketFilterTabs, type MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { MarketplaceScreen } from './MarketplaceScreen'

const empty: MarketplaceScreenModel = {
  phase: 'empty', cards: [],
  queryInputProps: {
    value: '', placeholder: copy.search.placeholder,
    'aria-label': copy.search.label, onChange: fn(),
  },
  filterTabs: buildMarketFilterTabs({ type: '', listed: false, onTypeChange: fn(), onListedChange: fn() }),
  tierSelectProps: { value: '', 'aria-label': copy.filters.tierLabel, onValueChange: fn() },
  sortChips: buildSortChipsModel({
    sortKey: 'new', dir: 'desc', onChange: fn(), disabledReason: copy.sortDisabledReason,
  }),
  createLinkProps: { to: '/binder/new' },
  filtersToggleProps: { onClick: fn(), 'aria-expanded': false, 'aria-controls': 'market-filters' },
  filtersToggleLabel: copy.filters.toggle,
  filtersPanelProps: { id: 'market-filters', 'data-collapsed': 'true' },
  statusProps: { role: 'status', 'aria-live': 'polite' },
  resultsLabel: copy.results.empty,
  clearFiltersProps: null,
  showLoading: false, showEmpty: true, showError: false, showGrid: false, showMore: false,
  skeletonCount: 8,
  errorMessage: copy.loadError,
  retryButtonProps: { onClick: fn(), disabled: false },
  retryLabel: copy.retry,
  loadMoreProps: { onClick: fn(), disabled: false, 'aria-busy': false },
  loadMoreLabel: copy.loadMore,
  loadMoreError: null,
  endOfListLabel: null,
}
const onType = fn()
const onListed = fn()
const ready: Partial<MarketplaceScreenModel> = {
  phase: 'ready', cards: marketplacePage.map(buildMemeCardModel),
  showEmpty: false, showGrid: true, resultsLabel: copy.results.count(marketplacePage.length),
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
    resultsLabel: copy.results.searching,
  },
}
export const Empty: Story = {}
export const Error: Story = {
  args: {
    phase: 'error', showEmpty: false, showError: true, resultsLabel: copy.results.errored,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(copy.loadError)
    await expect(canvas.getByRole('button', { name: copy.retry })).toBeInTheDocument()
  },
}
export const Ready: Story = {
  args: { ...ready, endOfListLabel: copy.endOfList },
}
export const ReadyWithMore: Story = { args: { ...ready, showMore: true } }
export const LoadMoreFailed: Story = {
  args: {
    ...ready, showMore: true, loadMoreLabel: copy.loadMoreRetry,
    loadMoreError: copy.loadMoreError,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(copy.loadMoreError)
    await expect(canvas.getByRole('button', { name: copy.loadMoreRetry })).toBeEnabled()
  },
}
/** Phone disclosure: the sticky row keeps search and the mint CTA, filters open on demand. */
export const FiltersNarrowed: Story = {
  args: {
    ...ready,
    filterTabs: buildMarketFilterTabs({ type: 'image', listed: true, onTypeChange: fn(), onListedChange: fn() }),
    tierSelectProps: { value: 'holo', 'aria-label': copy.filters.tierLabel, onValueChange: fn() },
    filtersToggleLabel: copy.filters.toggleWithCount(3),
    filtersToggleProps: { onClick: fn(), 'aria-expanded': true, 'aria-controls': 'market-filters' },
    filtersPanelProps: { id: 'market-filters', 'data-collapsed': 'false' },
    resultsLabel: copy.results.line([copy.results.count(2), copy.filters.media.images, 'Holo', copy.results.activeListed]),
    clearFiltersProps: { onClick: fn() },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent(copy.results.line([copy.filters.media.images, 'Holo', copy.results.activeListed]))
    // filter row uses pressed tabs — aria-pressed, not a checked box
    const media = within(canvas.getByRole('group', { name: copy.filters.media.groupLabel }))
    await expect(media.getByRole('button', { name: copy.filters.media.images })).toHaveAttribute('aria-pressed', 'true')
    await expect(media.getByRole('button', { name: copy.filters.media.all })).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByRole('button', { name: copy.filters.listed })).toHaveAttribute('aria-pressed', 'true')
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
    const media = within(canvas.getByRole('group', { name: copy.filters.media.groupLabel }))
    await expect(media.getByRole('button', { name: copy.filters.media.all })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(media.getByRole('button', { name: copy.filters.media.videos }))
    await expect(onType).toHaveBeenLastCalledWith('video')
    await userEvent.click(canvas.getByRole('button', { name: copy.filters.listed }))
    await expect(onListed).toHaveBeenLastCalledWith(true)
    // a 46px pill on a coarse pointer is already past the 44px floor
    await expect(media.getByRole('button', { name: copy.filters.media.videos }).getBoundingClientRect().height).toBe(46)
  },
}

/** The dark arm of the whole page: plate, pressed tabs, neutral Mint, tier frames. */
export const Dark: Story = {
  args: { ...ready, endOfListLabel: copy.endOfList },
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
