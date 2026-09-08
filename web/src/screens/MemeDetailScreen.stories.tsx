import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import {
  FIXED_NOW,
  giftablePaper,
  listedHolo,
  meLou,
  memeplexFamily,
  paperMeme,
} from '../../.storybook/fixtures'
import type { MemeDetailScreenModel } from '../hooks/useMemeDetailScreen'
import { MemeDetailScreen } from './MemeDetailScreen'

const handlers = {
  onCopyShare: fn(),
  onRemix: fn(),
  onClaim: fn(),
  onToggleVisibility: fn(),
  onAskDelete: fn(),
  onCancelDelete: fn(),
  onConfirmDelete: fn(),
  onBuySharesChange: fn(),
  onBuy: fn(),
  onUnlist: fn(),
  onSellSharesChange: fn(),
  onPriceChange: fn(),
  onList: fn(),
  onPlexPickChange: fn(),
  onPlexPastedChange: fn(),
  onPlexAdd: fn(),
} satisfies Partial<MemeDetailScreenModel>

const base: MemeDetailScreenModel = {
  phase: 'loading',
  meme: null,
  stats: null,
  capTable: [],
  msg: null,
  err: null,
  copied: false,
  confirmingDelete: false,
  deleting: false,
  price: 1,
  sellShares: 10,
  buyShares: 1,
  plex: null,
  plexBinder: [],
  plexPick: '',
  plexPasted: '',
  plexMsg: null,
  shareUrl: '',
  myShares: 0,
  isSeller: false,
  showNotFound: false,
  showLoading: true,
  showUserActions: true,
  showClaim: false,
  showVisibility: false,
  showDelete: false,
  canEditPlex: false,
  ...handlers,
}

const paperCap = [{ userId: meLou.sub, shares: 100, label: 'You' }]
const listedCap = [
  { userId: meLou.sub, shares: 90, label: 'You' },
  { userId: 'user-pal', shares: 10, label: 'pal' },
]
const stats = {
  views: 60,
  reshares: 60,
  sources: [
    { source: 'reddit', url: 'https://reddit.com/r/memes', views: 12, firstSeen: FIXED_NOW },
  ],
}

const meta = {
  title: 'Screens/MemeDetailScreen',
  component: MemeDetailScreen,
  args: base,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MemeDetailScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {}

export const Empty: Story = {
  args: { phase: 'empty', showNotFound: true, showLoading: false },
}

export const Error: Story = {
  args: {
    phase: 'error',
    meme: paperMeme,
    shareUrl: `https://memeon.ai/m/${paperMeme.id}`,
    capTable: paperCap,
    myShares: 100,
    showLoading: false,
    showVisibility: true,
    canEditPlex: true,
    plex: memeplexFamily,
    plexBinder: [giftablePaper],
    err: 'action failed',
  },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    meme: paperMeme,
    shareUrl: `https://memeon.ai/m/${paperMeme.id}`,
    capTable: paperCap,
    myShares: 100,
    showLoading: false,
    showVisibility: true,
    canEditPlex: true,
    plex: memeplexFamily,
    plexBinder: [giftablePaper],
    stats,
  },
}

export const Listing: Story = {
  args: {
    phase: 'listing',
    meme: paperMeme,
    shareUrl: `https://memeon.ai/m/${paperMeme.id}`,
    capTable: paperCap,
    myShares: 100,
    showLoading: false,
    showVisibility: true,
    canEditPlex: true,
    plex: memeplexFamily,
    sellShares: 10,
    price: 1,
  },
}

export const Buying: Story = {
  args: {
    phase: 'buying',
    meme: listedHolo,
    shareUrl: `https://memeon.ai/m/${listedHolo.id}`,
    capTable: listedCap,
    myShares: 0,
    isSeller: false,
    showLoading: false,
    canEditPlex: false,
    plex: memeplexFamily,
    buyShares: 2,
    stats,
  },
}

export const Deleting: Story = {
  args: {
    phase: 'deleting',
    meme: { ...paperMeme, private: true },
    shareUrl: `https://memeon.ai/m/${paperMeme.id}`,
    capTable: paperCap,
    myShares: 100,
    showLoading: false,
    showVisibility: true,
    showDelete: true,
    canEditPlex: true,
    plex: memeplexFamily,
    confirmingDelete: true,
    deleting: true,
  },
}
