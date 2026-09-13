import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import { friendAccepted, giftablePaper } from '../../.storybook/fixtures'
import { friendsCopy as copy } from '../copy/friends'
import { buildFriendLinkModel, type FriendsScreenModel } from '../hooks/useFriendsScreen'
import { buildConfirmDialogModel } from '../lib/confirmDialogModel'
import { buildGiftDialogModel } from '../lib/giftDialogModel'
import { FriendsScreen } from './FriendsScreen'

const friendIncoming = { ...friendAccepted, status: 'incoming' as const }
const friendOutgoing = { ...friendAccepted, status: 'outgoing' as const }
const searchHit = { sub: friendAccepted.sub, name: friendAccepted.name, picture: friendAccepted.picture }

const friendLink = buildFriendLinkModel
const statsLabel = copy.row.stats(friendAccepted.collectionSize, friendAccepted.portfolioValue)
const searchInput = (value: string) => ({ value, onChange: fn(), 'aria-label': copy.search.inputLabel })
const incomingRow = () => ({
  ...friendLink(friendIncoming),
  statsLabel,
  acceptButtonProps: { onClick: fn(), 'aria-label': copy.row.accept(friendIncoming.name) },
  declineButtonProps: { onClick: fn(), 'aria-label': copy.row.decline(friendIncoming.name) },
})
const outgoingRow = () => ({
  ...friendLink(friendOutgoing),
  statsLabel,
  pendingLabel: copy.row.pending,
  cancelButtonProps: { onClick: fn(), 'aria-label': copy.row.cancelRequest(friendOutgoing.name) },
})

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
  tradeLinkProps: { to: '/trade', 'aria-label': copy.row.tradeWith(friendAccepted.name) },
  giftLabel: copy.row.gift,
  giftButtonProps: { onClick: fn(), 'aria-label': copy.row.giftTo(friendAccepted.name) },
  removeLabel: copy.row.remove,
  removeButtonProps: { onClick: fn(), 'aria-label': copy.row.removeName(friendAccepted.name) },
  ...overrides,
})

const empty: FriendsScreenModel = {
  phase: 'empty',
  searchInputProps: searchInput(''),
  hits: [],
  msg: null,
  err: null,
  inviteLabel: copy.invite.button,
  onlineFriends: [],
  onlineCountLabel: copy.online.count(0),
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
  searchingLabel: copy.search.searching,
  noHitsMessage: copy.search.noHits('pal'),
  loadingLabel: copy.loading,
  errorTitle: copy.loadError.title,
  errorMessage: copy.loadError.body,
  retryLabel: copy.loadError.retry,
  retryButtonProps: { onClick: fn() },
  emptyTitle: copy.empty.title,
  emptyMessage: copy.empty.body,
  emptyActionProps: { onClick: fn() },
  circleHintMessage: copy.circleHint.incoming,
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
    incoming: [incomingRow()],
  },
}

export const IncomingOnly: Story = {
  name: 'Incoming only (no circle yet)',
  args: {
    phase: 'ready',
    showEmpty: false,
    showIncoming: true,
    showCircleHint: true,
    incoming: [incomingRow()],
  },
}

export const Outgoing: Story = {
  name: 'Outgoing only (requests you sent)',
  args: {
    phase: 'ready',
    showEmpty: false,
    showOutgoing: true,
    showCircleHint: true,
    circleHintMessage: copy.circleHint.outgoing,
    outgoing: [outgoingRow()],
  },
}

export const SearchHits: Story = {
  args: {
    searchInputProps: searchInput('pal'),
    showSearchPanel: true,
    showHits: true,
    hits: [{
      ...buildFriendLinkModel(searchHit),
      requestButtonProps: { onClick: fn(), 'aria-label': copy.search.requestLabel(searchHit.name) },
    }],
  },
}

export const Searching: Story = {
  args: {
    searchInputProps: searchInput('pal'),
    showSearchPanel: true,
    showSearching: true,
  },
}

export const NoSearchResults: Story = {
  args: {
    searchInputProps: searchInput('pal'),
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
    err: copy.errors.request,
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
