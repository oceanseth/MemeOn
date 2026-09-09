import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { marketplacePage } from '../../.storybook/fixtures'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { buildSortChipsModel } from '../lib/sortChipsModel'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { MarketplaceScreen } from './MarketplaceScreen'

const empty: MarketplaceScreenModel = {
  phase: 'empty', cards: [],
  queryInputProps: { value: '', onChange: fn() }, typeSelectProps: { value: '', onChange: fn() },
  tierSelectProps: { value: '', onChange: fn() }, listedInputProps: { checked: false, onChange: fn() },
  sortChips: buildSortChipsModel({ sortKey: 'new', dir: 'desc', onChange: fn() }),
  createLinkProps: { to: '/binder/new' }, showLoading: false, showEmpty: true, showGrid: false, showMore: false,
}
const meta = { title: 'Screens/MarketplaceScreen', component: MarketplaceScreen, args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof MarketplaceScreen>
export default meta
type Story = StoryObj<typeof meta>
export const Loading: Story = { args: { phase: 'loading', showLoading: true, showEmpty: false, showGrid: false } }
export const Empty: Story = {}
export const Error: Story = { args: { phase: 'error' } }
export const Ready: Story = { args: { phase: 'ready', cards: marketplacePage.map(buildMemeCardModel), showEmpty: false, showGrid: true } }
export const ReadyWithMore: Story = { args: { phase: 'ready', cards: marketplacePage.map(buildMemeCardModel), showEmpty: false, showGrid: true, showMore: true } }
