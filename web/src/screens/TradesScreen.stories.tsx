import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import {
  friendAccepted,
  giftablePaper,
  meLou,
  paperMeme,
  proposedTrade,
  silverMeme,
} from '../../.storybook/fixtures'
import type { TradesScreenModel } from '../hooks/useTradesScreen'
import { TradesScreen } from './TradesScreen'

const handlers = {
  onToggleNew: fn(),
  onRespond: fn(),
  onToIdChange: fn(),
  onOfferMemeChange: fn(),
  onOfferSharesChange: fn(),
  onOfferCoinsChange: fn(),
  onAskMemeChange: fn(),
  onAskSharesChange: fn(),
  onAskCoinsChange: fn(),
  onPropose: fn(),
} satisfies Partial<TradesScreenModel>

const accepted = { ...proposedTrade, id: 'trade-2', status: 'accepted' as const }

const memeNames = {
  [paperMeme.id]: paperMeme.title,
  [silverMeme.id]: silverMeme.title,
}

const empty: TradesScreenModel = {
  phase: 'empty',
  open: [],
  history: [],
  msg: null,
  composeErr: null,
  showNew: false,
  friends: [],
  binder: [],
  theirMemes: [],
  toId: '',
  offerMeme: '',
  offerShares: 10,
  offerCoins: 0,
  askMeme: '',
  askShares: 10,
  askCoins: 0,
  busy: false,
  memeNames,
  meSub: meLou.sub,
  showLoading: false,
  showLists: true,
  showOfferShares: false,
  showAskShares: false,
  canPropose: false,
  ...handlers,
}

const meta = {
  title: 'Screens/TradesScreen',
  component: TradesScreen,
  args: empty,
} satisfies Meta<typeof TradesScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { phase: 'loading', showLoading: true, showLists: false },
}

export const Empty: Story = {}

export const Error: Story = {
  args: {
    phase: 'error',
    open: [proposedTrade],
    msg: 'action failed',
  },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    open: [proposedTrade],
    history: [accepted],
  },
}

export const Composing: Story = {
  args: {
    phase: 'composing',
    showNew: true,
    friends: [friendAccepted],
    binder: [giftablePaper],
    theirMemes: [silverMeme],
    toId: friendAccepted.sub,
    offerMeme: giftablePaper.id,
    offerShares: 5,
    showOfferShares: true,
    canPropose: true,
    open: [proposedTrade],
  },
}

export const Acting: Story = {
  args: {
    phase: 'acting',
    open: [proposedTrade],
    history: [accepted],
  },
}
