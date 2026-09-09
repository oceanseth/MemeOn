import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { friendAccepted, giftablePaper } from '../../.storybook/fixtures'
import { buildFriendLinkModel, type FriendsScreenModel } from '../hooks/useFriendsScreen'
import { buildGiftDialogModel } from '../lib/giftDialogModel'
import { FriendsScreen } from './FriendsScreen'

const friendIncoming = { ...friendAccepted, status: 'incoming' as const }
const friendOutgoing = { ...friendAccepted, status: 'outgoing' as const }
const searchHit = { sub: friendAccepted.sub, name: friendAccepted.name, picture: friendAccepted.picture }

const friendLink = buildFriendLinkModel
const giftDialog = buildGiftDialogModel({
  open: false, recipient: null, memes: [], query: '', pick: null, shares: 1, busy: false, error: null,
  onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onClose: fn(), onSubmit: fn(),
})

const empty: FriendsScreenModel = {
  phase: 'empty',
  searchInputProps: { value: '', onChange: fn() },
  hits: [],
  msg: null,
  inviteLabel: '💌 Invite a friend',
  onlineFriends: [],
  incoming: [],
  outgoing: [],
  accepted: [],
  showMsg: false,
  showOnline: false,
  showHits: false,
  showIncoming: false,
  showLoading: false,
  showEmpty: true,
  showCircle: false,
  emptyMessage: 'No friends yet. Search above and build your trading circle.',
  inviteButtonProps: { onClick: fn() },
  giftDialog,
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
  name: 'Error (prop fixture only)',
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
    accepted: [{ ...friendLink(friendAccepted), isOnline: false, statsLabel: `📚 ${friendAccepted.collectionSize} memes · 🧠 ${friendAccepted.portfolioValue.toLocaleString()} portfolio`, giftButtonProps: { onClick: fn() }, removeButtonProps: { onClick: fn() } }],
  },
}

export const Incoming: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    showIncoming: true,
    incoming: [{ ...friendLink(friendIncoming), acceptButtonProps: { onClick: fn() }, declineButtonProps: { onClick: fn() } }],
  },
}

export const Outgoing: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    outgoing: [{ ...friendLink(friendOutgoing), cancelButtonProps: { onClick: fn() } }],
  },
}

export const SearchHits: Story = {
  args: {
    searchInputProps: { value: 'pal', onChange: fn() },
    showHits: true,
    hits: [{ ...buildFriendLinkModel(searchHit), requestButtonProps: { onClick: fn() } }],
  },
}

export const Online: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    showOnline: true,
    accepted: [{ ...friendLink(friendAccepted), isOnline: true, statsLabel: `📚 ${friendAccepted.collectionSize} memes · 🧠 ${friendAccepted.portfolioValue.toLocaleString()} portfolio`, giftButtonProps: { onClick: fn() }, removeButtonProps: { onClick: fn() } }],
    onlineFriends: [friendLink(friendAccepted)],
  },
}

export const GiftOpen: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    accepted: [{ ...friendLink(friendAccepted), isOnline: false, statsLabel: `📚 ${friendAccepted.collectionSize} memes · 🧠 ${friendAccepted.portfolioValue.toLocaleString()} portfolio`, giftButtonProps: { onClick: fn() }, removeButtonProps: { onClick: fn() } }],
    giftDialog: buildGiftDialogModel({ open: true, recipient: { sub: friendAccepted.sub, name: friendAccepted.name }, memes: [giftablePaper], query: '', pick: null, shares: 1, busy: false, error: null, onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onClose: fn(), onSubmit: fn() }),
  },
}
