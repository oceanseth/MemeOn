import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { friendAccepted, giftablePaper } from '../../.storybook/fixtures'
import { buildFriendLinkModel, type FriendsScreenModel } from '../hooks/useFriendsScreen'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import { buildGiftDialogModel } from '../lib/giftDialogModel'
import { FriendsScreen } from './FriendsScreen'

const friendIncoming = { ...friendAccepted, status: 'incoming' as const }
const friendOutgoing = { ...friendAccepted, status: 'outgoing' as const }
const searchHit = { sub: friendAccepted.sub, name: friendAccepted.name, picture: friendAccepted.picture }

const friendLink = buildFriendLinkModel
const statsLabel = `📚 ${friendAccepted.collectionSize} memes · 🧠 ${friendAccepted.portfolioValue.toLocaleString()} held`

const giftDialog = buildGiftDialogModel({
  open: false, recipient: null, memes: [], query: '', pick: null, shares: 1, busy: false, error: null,
  onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onSharesBlur: fn(), onClose: fn(), onSubmit: fn(),
})
const removeDialog = buildConfirmDialogModel({
  open: false, title: '', message: '', danger: true, onConfirm: fn(), onCancel: fn(),
})

const acceptedRow = (overrides: Partial<FriendsScreenModel['accepted'][number]> = {}) => ({
  ...friendLink(friendAccepted),
  isOnline: false,
  onlineLabel: 'Online now',
  statsLabel,
  tradeLabel: 'Trade',
  tradeLinkProps: { to: '/trade', 'aria-label': `Trade with ${friendAccepted.name}` },
  giftLabel: 'Gift',
  giftButtonProps: { onClick: fn(), 'aria-label': `Gift shares to ${friendAccepted.name}` },
  removeLabel: 'Remove',
  removeButtonProps: { onClick: fn(), 'aria-label': `Remove ${friendAccepted.name}` },
  ...overrides,
})

const empty: FriendsScreenModel = {
  phase: 'empty',
  searchInputProps: { value: '', onChange: fn(), 'aria-label': 'Find people by name' },
  hits: [],
  msg: null,
  err: null,
  inviteLabel: '💌 Invite a friend',
  onlineFriends: [],
  onlineCountLabel: '0 friends online',
  incoming: [],
  outgoing: [],
  accepted: [],
  showMsg: false,
  showErr: false,
  showOnline: false,
  showSearchPanel: false,
  showSearching: false,
  showHits: false,
  showNoHits: false,
  showIncoming: false,
  showOutgoing: false,
  showLoading: false,
  showError: false,
  showEmpty: true,
  showCircle: false,
  showCircleHint: false,
  searchingLabel: 'Searching…',
  noHitsMessage: 'No one goes by "pal" — check the spelling, or invite them.',
  loadingLabel: 'Loading friends…',
  errorTitle: "Couldn't load your friends.",
  errorMessage: 'Check your connection and try again.',
  retryLabel: 'Retry',
  retryButtonProps: { onClick: fn() },
  emptyTitle: 'No friends yet',
  emptyMessage: "Invite someone and you can gift shares straight from your binder and watch each other's portfolios.",
  emptyActionProps: { onClick: fn() },
  circleHintMessage: 'Accept a request to start your circle.',
  inviteButtonProps: { onClick: fn() },
  giftDialog,
  removeDialog,
}

/** Storybook's viewport global; the vitest storybook project renders at the story's own width. */
const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
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
  args: { phase: 'error', showEmpty: false, showError: true },
}

export const Ready: Story = {
  args: { phase: 'ready', showEmpty: false, showCircle: true, accepted: [acceptedRow()] },
}

export const Incoming: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    showIncoming: true,
    accepted: [acceptedRow()],
    incoming: [{
      ...friendLink(friendIncoming),
      statsLabel,
      acceptButtonProps: { onClick: fn(), 'aria-label': `Accept ${friendIncoming.name}'s request` },
      declineButtonProps: { onClick: fn(), 'aria-label': `Decline ${friendIncoming.name}'s request` },
    }],
  },
}

export const IncomingOnly: Story = {
  name: 'Incoming only (no circle yet)',
  args: {
    phase: 'ready',
    showEmpty: false,
    showIncoming: true,
    showCircleHint: true,
    incoming: [{
      ...friendLink(friendIncoming),
      statsLabel,
      acceptButtonProps: { onClick: fn(), 'aria-label': `Accept ${friendIncoming.name}'s request` },
      declineButtonProps: { onClick: fn(), 'aria-label': `Decline ${friendIncoming.name}'s request` },
    }],
  },
}

export const Outgoing: Story = {
  name: 'Outgoing only (requests you sent)',
  args: {
    phase: 'ready',
    showEmpty: false,
    showOutgoing: true,
    showCircleHint: true,
    circleHintMessage: 'No one has accepted yet — your sent requests are still out there.',
    outgoing: [{
      ...friendLink(friendOutgoing),
      statsLabel,
      pendingLabel: 'Pending',
      cancelButtonProps: { onClick: fn(), 'aria-label': `Cancel your request to ${friendOutgoing.name}` },
    }],
  },
}

export const SearchHits: Story = {
  args: {
    searchInputProps: { value: 'pal', onChange: fn(), 'aria-label': 'Find people by name' },
    showSearchPanel: true,
    showHits: true,
    hits: [{
      ...buildFriendLinkModel(searchHit),
      requestButtonProps: { onClick: fn(), 'aria-label': `Add friend — send ${searchHit.name} a friend request` },
    }],
  },
}

export const Searching: Story = {
  args: {
    searchInputProps: { value: 'pal', onChange: fn(), 'aria-label': 'Find people by name' },
    showSearchPanel: true,
    showSearching: true,
  },
}

export const NoSearchResults: Story = {
  args: {
    searchInputProps: { value: 'pal', onChange: fn(), 'aria-label': 'Find people by name' },
    showSearchPanel: true,
    showNoHits: true,
  },
}

export const RequestFailed: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    accepted: [acceptedRow()],
    showErr: true,
    err: "Couldn't send that friend request. Try again in a moment.",
  },
}

export const RowBusy: Story = {
  name: 'Row busy (mutation in flight)',
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    accepted: [acceptedRow({
      giftButtonProps: { onClick: fn(), 'aria-label': `Gift shares to ${friendAccepted.name}`, disabled: true },
      removeButtonProps: { onClick: fn(), 'aria-label': `Remove ${friendAccepted.name}`, disabled: true, 'aria-busy': true },
    })],
  },
}

export const Online: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    showOnline: true,
    accepted: [acceptedRow({ isOnline: true })],
    onlineFriends: [friendLink(friendAccepted)],
    onlineCountLabel: '1 friend online',
  },
}

export const GiftOpen: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    accepted: [acceptedRow()],
    giftDialog: buildGiftDialogModel({
      open: true, recipient: { sub: friendAccepted.sub, name: friendAccepted.name }, memes: [giftablePaper],
      query: '', pick: null, shares: 1, busy: false, error: null,
      onQueryChange: fn(), onPick: fn(), onSharesChange: fn(), onSharesBlur: fn(), onClose: fn(), onSubmit: fn(),
    }),
  },
}

export const ConfirmRemove: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    accepted: [acceptedRow()],
    removeDialog: buildConfirmDialogModel({
      open: true,
      danger: true,
      title: `Remove ${friendAccepted.name}?`,
      message: "You'll drop out of each other's circles and lose the shortcut to trade and gift. You can send a new request later.",
      confirmLabel: 'Remove',
      cancelLabel: 'Keep friend',
      onConfirm: fn(),
      onCancel: fn(),
    }),
  },
}

/** The whole page with every section filled: the state the dark and phone twins are cut from. */
export const Full: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showCircle: true,
    showOnline: true,
    showIncoming: true,
    showOutgoing: true,
    accepted: [acceptedRow({ isOnline: true })],
    onlineFriends: [friendLink(friendAccepted)],
    onlineCountLabel: '1 friend online',
    incoming: [{
      ...friendLink(friendIncoming),
      statsLabel,
      acceptButtonProps: { onClick: fn(), 'aria-label': `Accept ${friendIncoming.name}'s request` },
      declineButtonProps: { onClick: fn(), 'aria-label': `Decline ${friendIncoming.name}'s request` },
    }],
    outgoing: [{
      ...friendLink(friendOutgoing),
      statsLabel,
      pendingLabel: 'Pending',
      cancelButtonProps: { onClick: fn(), 'aria-label': `Cancel your request to ${friendOutgoing.name}` },
    }],
  },
}

export const Dark: Story = { ...Full, name: 'Ready dark', globals: { theme: 'dark' } }

export const Phone390: Story = { ...Full, name: 'Ready phone 390', ...phone }

export const DarkPhone390: Story = {
  ...Full,
  name: 'Ready dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}
