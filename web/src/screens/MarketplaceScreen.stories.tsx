import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { marketplacePage } from '../../.storybook/fixtures'
import type { MarketplaceScreenModel } from '../hooks/useMarketplaceScreen'
import { MarketplaceScreen } from './MarketplaceScreen'

const handlers = {
  onQueryChange: fn(),
  onTypeChange: fn(),
  onTierChange: fn(),
  onListedChange: fn(),
  onSortChange: fn(),
} satisfies Partial<MarketplaceScreenModel>

const empty: MarketplaceScreenModel = {
  phase: 'empty',
  memes: [],
  nextCursor: null,
  q: '',
  type: '',
  tier: '',
  listed: false,
  sortKey: 'new',
  sortDir: 'desc',
  showLoading: false,
  showEmpty: true,
  showGrid: false,
  showMore: false,
  ...handlers,
}

const meta = {
  title: 'Screens/MarketplaceScreen',
  component: MarketplaceScreen,
  args: empty,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MarketplaceScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { phase: 'loading', showLoading: true, showEmpty: false },
}

export const Empty: Story = {}

export const Error: Story = {
  args: { phase: 'error' },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    memes: marketplacePage,
    showEmpty: false,
    showGrid: true,
  },
}

export const ReadyWithMore: Story = {
  args: {
    phase: 'ready',
    memes: marketplacePage,
    nextCursor: 'cursor-2',
    showEmpty: false,
    showGrid: true,
    showMore: true,
  },
}
