import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'
import { friendsCopy } from '../copy/friends'
import type { ConfirmDialogModel } from './confirmDialogModel'
import type { GiftDialogModel } from './giftDialogModel'
import type { FriendEntry } from './types'
import type {
  FriendsContext,
  FriendsPhase,
  GiftTarget,
  PendingRemoval,
  UserHit,
} from '../stores/friendsMachine'

export type { FriendsPhase }

const copy = friendsCopy

type RowButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'aria-label' | 'disabled' | 'aria-busy'
>

export interface FriendLinkModel {
  sub: string
  name: string
  profileLinkProps: Pick<LinkProps, 'to'>
  onlineLinkProps: Pick<LinkProps, 'to' | 'title'>
  /** `<Avatar>` draws the monogram fallback itself whenever there is no picture. */
  avatarSrc: string | null
}

export interface FriendHitModel extends FriendLinkModel {
  requestButtonProps: RowButtonProps
}

export interface IncomingFriendModel extends FriendLinkModel {
  statsLabel: string
  acceptButtonProps: RowButtonProps
  declineButtonProps: RowButtonProps
}

export interface OutgoingFriendModel extends FriendLinkModel {
  statsLabel: string
  pendingLabel: string
  cancelButtonProps: RowButtonProps
}

export interface AcceptedFriendModel extends FriendLinkModel {
  isOnline: boolean
  onlineLabel: string
  statsLabel: string
  /** Quieter companion action beside Gift. */
  tradeLabel: string
  tradeLinkProps: Pick<LinkProps, 'to' | 'aria-label'>
  giftLabel: string
  giftButtonProps: RowButtonProps
  removeLabel: string
  removeButtonProps: RowButtonProps
}

export interface FriendsScreenModel {
  phase: FriendsPhase
  pageTitle: string
  searchInputProps: Pick<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'aria-label' | 'placeholder'
  >
  msg: string | null
  err: string | null
  inviteLabel: string
  searchResultsHeading: string
  addFriendLabel: string
  onlineHeading: string
  circleHeading: string
  incomingHeading: string
  outgoingHeading: string
  acceptLabel: string
  declineLabel: string
  cancelLabel: string
  inviteButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  onlineFriends: readonly FriendLinkModel[]
  /** Trailing caption on the online strip. */
  onlineCountLabel: string
  hits: readonly FriendHitModel[]
  incoming: readonly IncomingFriendModel[]
  outgoing: readonly OutgoingFriendModel[]
  accepted: readonly AcceptedFriendModel[]
  showMsg: boolean
  showErr: boolean
  showOnline: boolean
  showSearchPanel: boolean
  showSearching: boolean
  showHits: boolean
  showNoHits: boolean
  showSearchFailed: boolean
  showIncoming: boolean
  showOutgoing: boolean
  showLoading: boolean
  showError: boolean
  showEmpty: boolean
  showCircle: boolean
  showCircleHint: boolean
  searchingLabel: string
  noHitsMessage: string
  searchFailedMessage: string
  loadingLabel: string
  errorTitle: string
  errorMessage: string
  retryLabel: string
  retryButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  emptyTitle: string
  emptyMessage: string
  emptyActionProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  circleHintMessage: string
  giftDialog: GiftDialogModel
  removeDialog: ConfirmDialogModel
}

/** Actor fields the row / show* projection reads. Gift/remove dialogs are already built. */
export type FriendsScreenProjection = Pick<
  FriendsContext,
  | 'friends'
  | 'query'
  | 'hits'
  | 'msg'
  | 'actionErr'
  | 'searchErr'
  | 'pendingSub'
  | 'searching'
  | 'onlineSubs'
  | 'copied'
  | 'copyFailed'
  | 'err'
>

export interface FriendsScreenActions {
  onRequest: (userId: string) => void
  onRespond: (userId: string, accept: boolean) => void
  onRemove: (userId: string) => void
  onGiftOpen: (friend: GiftTarget) => void
  onAskRemove: (removal: PendingRemoval) => void
}

export interface BuildFriendsScreenModelInput {
  phase: FriendsPhase
  ctx: FriendsScreenProjection
  searchInputProps: FriendsScreenModel['searchInputProps']
  inviteButtonProps: FriendsScreenModel['inviteButtonProps']
  retryButtonProps: FriendsScreenModel['retryButtonProps']
  emptyActionProps: FriendsScreenModel['emptyActionProps']
  giftDialog: GiftDialogModel
  removeDialog: ConfirmDialogModel
  actions: FriendsScreenActions
}

function statsLine(friend: { collectionSize: number; portfolioValue: number }): string {
  return copy.row.stats(friend.collectionSize, friend.portfolioValue)
}

function busyProps(busySub: string | null, sub: string): Pick<RowButtonProps, 'disabled' | 'aria-busy'> {
  return { disabled: busySub === sub, 'aria-busy': busySub === sub }
}

/** Turns nullable social-avatar data into safe element props before markup sees it. */
export function buildFriendLinkModel(friend: { sub: string; name: string; picture: string | null }): FriendLinkModel {
  const profileLinkProps = { to: `/u/${encodeURIComponent(friend.sub)}` }
  return {
    sub: friend.sub,
    name: friend.name,
    profileLinkProps,
    onlineLinkProps: { ...profileLinkProps, title: friend.name },
    avatarSrc: friend.picture,
  }
}

function projectHits(
  hits: readonly UserHit[],
  busySub: string | null,
  onRequest: FriendsScreenActions['onRequest'],
): FriendHitModel[] {
  return hits.map((hit) => ({
    ...buildFriendLinkModel(hit),
    requestButtonProps: {
      onClick: () => onRequest(hit.sub),
      'aria-label': copy.search.requestLabel(hit.name),
      ...busyProps(busySub, hit.sub),
    },
  }))
}

function projectIncoming(
  friends: readonly FriendEntry[],
  busySub: string | null,
  actions: FriendsScreenActions,
): IncomingFriendModel[] {
  return friends.map((friend) => ({
    ...buildFriendLinkModel(friend),
    statsLabel: statsLine(friend),
    acceptButtonProps: {
      onClick: () => actions.onRespond(friend.sub, true),
      'aria-label': copy.row.accept(friend.name),
      ...busyProps(busySub, friend.sub),
    },
    declineButtonProps: {
      onClick: () => actions.onAskRemove({ sub: friend.sub, name: friend.name, kind: 'decline' }),
      'aria-label': copy.row.decline(friend.name),
      ...busyProps(busySub, friend.sub),
    },
  }))
}

function projectOutgoing(
  friends: readonly FriendEntry[],
  busySub: string | null,
  onRemove: FriendsScreenActions['onRemove'],
): OutgoingFriendModel[] {
  return friends.map((friend) => ({
    ...buildFriendLinkModel(friend),
    statsLabel: statsLine(friend),
    pendingLabel: copy.row.pending,
    cancelButtonProps: {
      onClick: () => onRemove(friend.sub),
      'aria-label': copy.row.cancelRequest(friend.name),
      ...busyProps(busySub, friend.sub),
    },
  }))
}

function projectAccepted(
  friends: readonly FriendEntry[],
  onlineSubs: readonly string[],
  busySub: string | null,
  actions: FriendsScreenActions,
): AcceptedFriendModel[] {
  return friends.map((friend) => ({
    ...buildFriendLinkModel(friend),
    isOnline: onlineSubs.includes(friend.sub),
    onlineLabel: copy.online.label,
    statsLabel: statsLine(friend),
    tradeLabel: copy.row.trade,
    tradeLinkProps: { to: '/trade', 'aria-label': copy.row.tradeWith(friend.name) },
    giftLabel: copy.row.gift,
    giftButtonProps: {
      onClick: () => actions.onGiftOpen({ sub: friend.sub, name: friend.name }),
      'aria-label': copy.row.giftTo(friend.name),
      disabled: busySub === friend.sub,
    },
    removeLabel: copy.row.remove,
    removeButtonProps: {
      onClick: () => actions.onAskRemove({ sub: friend.sub, name: friend.name, kind: 'remove' }),
      'aria-label': copy.row.removeName(friend.name),
      ...busyProps(busySub, friend.sub),
    },
  }))
}

/** Screen bag: show* flags and every hits/incoming/outgoing/accepted/online row. */
export function buildFriendsScreenModel(input: BuildFriendsScreenModelInput): FriendsScreenModel {
  const { phase, ctx, actions } = input
  const incoming = ctx.friends.filter((friend) => friend.status === 'incoming')
  const outgoing = ctx.friends.filter((friend) => friend.status === 'outgoing')
  const accepted = ctx.friends.filter((friend) => friend.status === 'accepted')
  const onlineFriends = accepted.filter((friend) => ctx.onlineSubs.includes(friend.sub))
  const trimmedQuery = ctx.query.trim()
  const panel = trimmedQuery.length > 0
  const busySub = ctx.pendingSub

  return {
    phase,
    pageTitle: copy.pageTitle,
    searchInputProps: input.searchInputProps,
    msg: ctx.msg,
    err: ctx.actionErr,
    inviteLabel: ctx.copied ? copy.invite.copied : ctx.copyFailed ? copy.invite.copyFailed : copy.invite.button,
    searchResultsHeading: copy.search.resultsHeading,
    addFriendLabel: copy.search.addFriend,
    onlineHeading: copy.online.label,
    circleHeading: copy.sections.circle,
    incomingHeading: copy.sections.incoming,
    outgoingHeading: copy.sections.outgoing,
    acceptLabel: copy.row.acceptLabel,
    declineLabel: copy.row.declineLabel,
    cancelLabel: copy.row.cancelLabel,
    inviteButtonProps: input.inviteButtonProps,
    onlineFriends: onlineFriends.map(buildFriendLinkModel),
    onlineCountLabel: copy.online.count(onlineFriends.length),
    hits: projectHits(ctx.hits, busySub, actions.onRequest),
    incoming: projectIncoming(incoming, busySub, actions),
    outgoing: projectOutgoing(outgoing, busySub, actions.onRemove),
    accepted: projectAccepted(accepted, ctx.onlineSubs, busySub, actions),
    showMsg: !!ctx.msg,
    showErr: !!ctx.actionErr,
    showOnline: onlineFriends.length > 0,
    showSearchPanel: panel,
    // results stay clickable while the next query debounces; only an empty list swaps to a state line
    showSearching: panel && ctx.searching && ctx.hits.length === 0,
    showHits: panel && ctx.hits.length > 0 && !ctx.searchErr,
    showNoHits: panel && !ctx.searching && ctx.hits.length === 0 && !ctx.searchErr,
    showSearchFailed: panel && !ctx.searching && !!ctx.searchErr,
    showIncoming: incoming.length > 0,
    showOutgoing: outgoing.length > 0,
    showLoading: phase === 'loading',
    showError: phase === 'error',
    showEmpty: phase === 'empty',
    showCircle: phase === 'ready' && accepted.length > 0,
    showCircleHint: phase === 'ready' && accepted.length === 0,
    searchingLabel: copy.search.searching,
    noHitsMessage: copy.search.noHits(trimmedQuery),
    searchFailedMessage: copy.search.failed,
    loadingLabel: copy.loading,
    errorTitle: copy.loadError.title,
    errorMessage: ctx.err ?? copy.loadError.body,
    retryLabel: copy.loadError.retry,
    retryButtonProps: input.retryButtonProps,
    emptyTitle: copy.empty.title,
    emptyMessage: copy.empty.body,
    emptyActionProps: input.emptyActionProps,
    circleHintMessage: incoming.length > 0 ? copy.circleHint.incoming : copy.circleHint.outgoing,
    giftDialog: input.giftDialog,
    removeDialog: input.removeDialog,
  }
}
