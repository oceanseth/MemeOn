import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { friendAccepted, giftablePaper } from '../../.storybook/fixtures'
import type { FriendsScreenModel } from '../hooks/useFriendsScreen'
import { FriendsScreen } from './FriendsScreen'

const friendIncoming = { ...friendAccepted, status: 'incoming' as const }
const friendOutgoing = { ...friendAccepted, status: 'outgoing' as const }
const searchHit = { sub: friendAccepted.sub, name: friendAccepted.name, picture: friendAccepted.picture }

const handlers = {
  onQueryChange: fn(),
  onCopyInvite: fn(),
  onRequest: fn(),
  onRespond: fn(),
  onRemove: fn(),
  onGiftOpen: fn(),
  onGiftQueryChange: fn(),
  onGiftPick: fn(),
  onGiftSharesChange: fn(),
  onGiftClose: fn(),
  onGiftSubmit: fn(),
} satisfies Partial<FriendsScreenModel>

const empty: FriendsScreenModel = {
  phase: 'empty',
  query: '',
  hits: [],
  msg: null,
  inviteLabel: '💌 Invite a friend',
  onlineFriends: [],
  incoming: [],
  outgoing: [],
  accepted: [],
  onlineSubs: [],
  showMsg: false,
  showOnline: false,
  showHits: false,
  showIncoming: false,
  showLoading: false,
  showEmpty: true,
  showCircle: false,
  emptyMessage: 'No friends yet. Search above and build your trading circle.',
  gifting: null,
  giftMemes: [],
  giftQuery: '',
  giftPick: null,
  giftShares: 1,
  giftBusy: false,
  giftErr: null,
  giftOpen: false,
  ...handlers,
}

const meta = {
  title: 'Screens/FriendsScreen',
  component: FriendsScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof FriendsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { phase: 'loading', showEmpty: false, showLoading: true },
}

export const Empty: Story = {}

export const Error: Story = {
  args: {
    phase: 'error',
    emptyMessage: 'could not load friends',
  },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    accepted: [friendAccepted],
  },
}

export const Incoming: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    showIncoming: true,
    incoming: [friendIncoming],
  },
}

export const Outgoing: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    outgoing: [friendOutgoing],
  },
}

export const SearchHits: Story = {
  args: {
    query: 'pal',
    showHits: true,
    hits: [searchHit],
  },
}

export const Online: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    showOnline: true,
    accepted: [friendAccepted],
    onlineFriends: [friendAccepted],
    onlineSubs: [friendAccepted.sub],
  },
}

export const GiftOpen: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    accepted: [friendAccepted],
    giftOpen: true,
    gifting: { sub: friendAccepted.sub, name: friendAccepted.name },
    giftMemes: [giftablePaper],
  },
}
