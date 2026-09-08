import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { giftablePaper, meLou, paperMeme } from '../../.storybook/fixtures'
import type { BinderScreenModel } from '../hooks/useBinderScreen'
import { BinderScreen } from './BinderScreen'

const handlers = {
  onShowPrivateChange: fn(),
  onSortChange: fn(),
} satisfies Partial<BinderScreenModel>

const empty: BinderScreenModel = {
  phase: 'empty',
  collectionLabel: `${meLou.collectionSize} positions · portfolio 🧠 ${meLou.portfolioValue.toLocaleString()}`,
  showCollection: true,
  showPrivateToggle: false,
  privateCount: 0,
  showPrivate: false,
  sortKey: 'new',
  sortDir: 'desc',
  visible: [],
  showLoading: false,
  showEmpty: true,
  emptyMessage: 'Your binder is empty. Mint your first meme and start the grind to ✨Shiny✨.',
  showGrid: false,
  ...handlers,
}

const meta = {
  title: 'Screens/BinderScreen',
  component: BinderScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof BinderScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { phase: 'loading', showEmpty: false, showLoading: true },
}

export const Empty: Story = {}

export const Error: Story = {
  args: {
    phase: 'error',
    emptyMessage: 'could not load binder',
  },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showGrid: true,
    visible: [giftablePaper],
  },
}

export const AllPrivate: Story = {
  args: {
    phase: 'ready',
    showPrivateToggle: true,
    privateCount: 1,
    emptyMessage: 'Everything here is private — tick "Show private" to see it.',
  },
}

export const ShowingPrivate: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showGrid: true,
    showPrivateToggle: true,
    privateCount: 1,
    showPrivate: true,
    visible: [{ ...paperMeme, private: true, myShares: 4, isCreator: true }],
  },
}
