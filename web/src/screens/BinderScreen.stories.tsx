import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { giftablePaper, meLou, paperMeme } from '../../.storybook/fixtures'
import type { BinderScreenModel } from '../hooks/useBinderScreen'
import { buildMemeCardModel } from '../lib/memeCardModel'
import { buildSortChipsModel } from '../lib/sortChipsModel'
import { BinderScreen } from './BinderScreen'

const empty: BinderScreenModel = {
  phase: 'empty',
  collectionLabel: `${meLou.collectionSize} positions · portfolio 🧠 ${meLou.portfolioValue.toLocaleString()}`,
  showCollection: true,
  showPrivateToggle: false,
  privateCount: 0,
  privateToggleProps: { checked: false, onChange: fn() },
  sortChips: buildSortChipsModel({ sortKey: 'new', dir: 'desc', onChange: fn() }),
  createLinkProps: { to: '/binder/new' },
  cards: [],
  showLoading: false,
  showEmpty: true,
  emptyMessage: 'Your binder is empty. Mint your first meme and start the grind to ✨Shiny✨.',
  showGrid: false,
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
  name: 'Error (prop fixture only)',
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
    cards: [{ id: giftablePaper.id, memeCard: buildMemeCardModel(giftablePaper), sharesLabel: '12/100 shares', showCreator: false, showPrivate: false }],
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
    privateToggleProps: { checked: true, onChange: fn() },
    cards: [{ id: paperMeme.id, memeCard: buildMemeCardModel(paperMeme), sharesLabel: '4/100 shares', showCreator: true, showPrivate: true }],
  },
}
