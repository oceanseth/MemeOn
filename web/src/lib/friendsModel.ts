import type { ButtonHTMLAttributes, ChangeEventHandler, InputHTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'
import { friendsCopy } from '../copy/friends'
import type {
  FriendsContext,
  FriendsPhase,
  GiftTarget,
  PendingRemoval,
  UserHit,
} from '../stores/friendsMachine'
import type { FriendEntry, Meme } from './types'
import { buildConfirmDialogModel, type ConfirmDialogModel } from './confirmDialogModel'
import {
  buildGiftDialogModel,
  clampGiftShares,
  type GiftDialogModel,
} from './giftDialogModel'

export type { FriendsPhase }

const copy = friendsCopy

const REMOVAL_COPY: Record<
  PendingRemoval['kind'],
  { title: (name: string) => string; body: string; confirm: string; cancel: string }
> = copy.removeDialog

type RowButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'aria-label' | 'disabled' | 'aria-busy'
>

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
  inviteCopied: boolean
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

/** IO the composer owns; the builder only wires it into props. */
export interface FriendsScreenModelActions {
  onQueryChange: (value: string) => void
  onCopyInvite: () => void
  onRequest: (userId: string) => void
  onRespond: (userId: string, accept: boolean) => void
  onRemove: (userId: string) => void
  onGiftOpen: (friend: GiftTarget) => void
  onGiftSubmit: () => void
  onGiftClose: () => void
  onGiftQueryChange: (query: string) => void
  onGiftPick: (pick: Meme) => void
  onGiftSharesInput: (value: string) => void
  onGiftShares: (shares: number) => void
  onGiftSharesBlur: () => void
  onAskRemove: (removal: PendingRemoval) => void
  onConfirmRemoval: () => void
  onCancelRemove: () => void
  onLoad: () => void
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
  onRequest: (userId: string) => void,
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
  actions: Pick<FriendsScreenModelActions, 'onRespond' | 'onAskRemove'>,
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
  onRemove: (userId: string) => void,
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
  actions: Pick<FriendsScreenModelActions, 'onGiftOpen' | 'onAskRemove'>,
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

/** Screen bag: show* flags, search/circle rows, gift and remove dialogs. */
export function buildFriendsScreenModel(
  phase: FriendsPhase,
  ctx: FriendsContext,
  actions: FriendsScreenModelActions,
): FriendsScreenModel {
  const incoming = ctx.friends.filter((friend) => friend.status === 'incoming')
  const outgoing = ctx.friends.filter((friend) => friend.status === 'outgoing')
  const accepted = ctx.friends.filter((friend) => friend.status === 'accepted')
  const onlineFriends = accepted.filter((friend) => ctx.onlineSubs.includes(friend.sub))
  const trimmedQuery = ctx.query.trim()
  const showSearchPanel = trimmedQuery.length > 0
  const busySub = ctx.pendingSub
  const giftMaxShares = Math.max(1, ctx.giftPick?.myShares ?? 1)
  const removal = ctx.pendingRemoval
  const removalCopy = REMOVAL_COPY[removal?.kind ?? 'remove']
  const showError = phase === 'error'

  return {
    phase,
    pageTitle: copy.pageTitle,
    searchInputProps: {
      value: ctx.query,
      onChange: ((event) => actions.onQueryChange(event.target.value)) as ChangeEventHandler<HTMLInputElement>,
      'aria-label': copy.search.inputLabel,
      placeholder: copy.search.placeholder,
    },
    msg: ctx.msg,
    err: ctx.actionErr,
    inviteCopied: ctx.copied,
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
    inviteButtonProps: { onClick: actions.onCopyInvite },
    onlineFriends: onlineFriends.map(buildFriendLinkModel),
    onlineCountLabel: copy.online.count(onlineFriends.length),
    hits: projectHits(ctx.hits, busySub, actions.onRequest),
    incoming: projectIncoming(incoming, busySub, actions),
    outgoing: projectOutgoing(outgoing, busySub, actions.onRemove),
    accepted: projectAccepted(accepted, ctx.onlineSubs, busySub, actions),
    showMsg: !!ctx.msg,
    showErr: !!ctx.actionErr && !showError,
    showOnline: onlineFriends.length > 0 && !showError,
    showSearchPanel,
    // results stay clickable while the next query debounces; only an empty list swaps to a state line
    showSearching: showSearchPanel && ctx.searching && ctx.hits.length === 0,
    showHits: showSearchPanel && ctx.hits.length > 0 && !ctx.searchErr,
    showNoHits: showSearchPanel && !ctx.searching && ctx.hits.length === 0 && !ctx.searchErr,
    showSearchFailed: showSearchPanel && !ctx.searching && !!ctx.searchErr,
    showIncoming: incoming.length > 0 && !showError,
    showOutgoing: outgoing.length > 0 && !showError,
    showLoading: phase === 'loading',
    showError,
    showEmpty: phase === 'empty',
    showCircle: phase === 'ready' && accepted.length > 0,
    showCircleHint: phase === 'ready' && accepted.length === 0,
    searchingLabel: copy.search.searching,
    noHitsMessage: copy.search.noHits(trimmedQuery),
    searchFailedMessage: copy.search.failed,
    loadingLabel: copy.loading,
    errorTitle: copy.loadError.title,
    errorMessage: copy.loadError.body,
    retryLabel: copy.loadError.retry,
    retryButtonProps: { onClick: actions.onLoad },
    emptyTitle: copy.empty.title,
    emptyMessage: copy.empty.body,
    emptyActionProps: { onClick: actions.onCopyInvite },
    circleHintMessage: incoming.length > 0 ? copy.circleHint.incoming : copy.circleHint.outgoing,
    giftDialog: buildGiftDialogModel({
      open: !!ctx.gifting,
      recipient: ctx.gifting,
      memes: ctx.giftMemes,
      query: ctx.giftQuery,
      pick: ctx.giftPick,
      shares: ctx.giftShares,
      sharesInput: ctx.giftSharesInput,
      busy: ctx.giftBusy,
      error: ctx.giftErr,
      onClose: actions.onGiftClose,
      onQueryChange: actions.onGiftQueryChange,
      onPick: actions.onGiftPick,
      onSharesChange: (rawValue) => {
        actions.onGiftSharesInput(rawValue)
        if (rawValue.trim()) actions.onGiftShares(clampGiftShares(rawValue, giftMaxShares))
      },
      onSharesBlur: actions.onGiftSharesBlur,
      onSubmit: actions.onGiftSubmit,
    }),
    removeDialog: buildConfirmDialogModel({
      id: 'friends-remove',
      open: !!removal,
      danger: true,
      title: removalCopy.title(removal?.name ?? ''),
      message: removalCopy.body,
      confirmLabel: removalCopy.confirm,
      cancelLabel: removalCopy.cancel,
      onConfirm: actions.onConfirmRemoval,
      onCancel: actions.onCancelRemove,
    }),
  }
}
