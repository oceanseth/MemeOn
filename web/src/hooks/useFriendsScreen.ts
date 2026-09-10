import { useProjectedActor } from './useProjectedActor'
import { useCallback, useRef, type ChangeEventHandler } from 'react'
import { useAuth } from './useAuth'
import { apiFetch, post } from '../lib/api'
import { watchPresence, type PresenceWatch } from '../lib/presence'
import type { FriendEntry, Meme } from '../lib/types'
import {
  friendsMachine,
  type FriendsPhase,
  type GiftTarget,
  type PendingRemoval,
  type UserHit,
} from '../stores/friendsMachine'
import { useMountEffect } from './useMountEffect'
import {
  buildGiftDialogModel,
  clampGiftShares,
  type GiftDialogModel,
} from '../lib/giftDialogModel'
import { buildConfirmDialogModel, type ConfirmDialogModel } from '../lib/confirmDialogModel'
import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'

export type { FriendsPhase, GiftTarget, UserHit }

/** Success banners clear themselves so they stop stacking up for the whole session. */
const MSG_TTL_MS = 6000

const REMOVAL_COPY: Record<
  PendingRemoval['kind'],
  { title: (name: string) => string; message: string; confirmLabel: string; cancelLabel: string }
> = {
  remove: {
    title: (name) => `Remove ${name}?`,
    message:
      "You'll drop out of each other's circles and lose the shortcut to trade and gift. You can send a new request later.",
    confirmLabel: 'Remove',
    cancelLabel: 'Keep friend',
  },
  decline: {
    title: (name) => `Decline ${name}'s request?`,
    message: "They are not told. If you change your mind they can send a new request.",
    confirmLabel: 'Decline',
    cancelLabel: 'Keep it',
  },
}

type RowButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'aria-label' | 'disabled' | 'aria-busy'
>

export interface FriendsScreenModel {
  phase: FriendsPhase
  searchInputProps: Pick<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'aria-label'
  >
  msg: string | null
  err: string | null
  inviteLabel: string
  inviteButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  onlineFriends: readonly FriendLinkModel[]
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
  showIncoming: boolean
  showOutgoing: boolean
  showLoading: boolean
  showError: boolean
  showEmpty: boolean
  showCircle: boolean
  showCircleHint: boolean
  searchingLabel: string
  noHitsMessage: string
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

interface FriendHitModel extends FriendLinkModel {
  requestButtonProps: RowButtonProps
}

interface IncomingFriendModel extends FriendLinkModel {
  acceptButtonProps: RowButtonProps
  declineButtonProps: RowButtonProps
}

interface OutgoingFriendModel extends FriendLinkModel {
  pendingLabel: string
  cancelButtonProps: RowButtonProps
}

interface AcceptedFriendModel extends FriendLinkModel {
  isOnline: boolean
  onlineLabel: string
  statsLabel: string
  giftLabel: string
  giftButtonProps: RowButtonProps
  removeLabel: string
  removeButtonProps: RowButtonProps
}

/** Everything `FriendsScreen` renders. The hook is the engine; the screen is the terminal. */
export function useFriendsScreen(): FriendsScreenModel {
  const { user } = useAuth()
  const [snapshot, send, actor] = useProjectedActor(friendsMachine)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const presence = useRef<PresenceWatch | null>(null)
  const ctx = snapshot.context
  const phase = snapshot.value as FriendsPhase

  const load = useCallback(() => {
    apiFetch<{ friends: FriendEntry[] }>('/api/friends')
      .then((r) => {
        presence.current?.setSubs?.(
          r.friends.filter((f) => f.status === 'accepted').map((f) => f.sub),
        )
        send({ type: 'DONE', friends: r.friends })
      })
      .catch(() => send({ type: 'FAIL', err: 'Check your connection and try again.' }))
  }, [send])

  useMountEffect(() => {
    const watch = watchPresence((online) => {
      const next = [...online].sort()
      const current = actor.getSnapshot().context.onlineSubs
      if (current.length === next.length && current.every((sub, index) => sub === next[index])) return
      send({ type: 'SET_ONLINE', onlineSubs: next })
    })
    presence.current = watch
    load()
    return () => {
      watch()
      presence.current = null
      if (searchTimer.current) clearTimeout(searchTimer.current)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      if (msgTimer.current) clearTimeout(msgTimer.current)
    }
  })

  const inviteLink = user ? `${window.location.origin}/invite/${encodeURIComponent(user.sub)}` : ''

  const incoming = ctx.friends.filter((f) => f.status === 'incoming')
  const outgoing = ctx.friends.filter((f) => f.status === 'outgoing')
  const accepted = ctx.friends.filter((f) => f.status === 'accepted')
  const onlineFriends = accepted.filter((f) => ctx.onlineSubs.includes(f.sub))

  const flashMsg = useCallback(
    (msg: string) => {
      send({ type: 'SET_MSG', msg })
      if (msgTimer.current) clearTimeout(msgTimer.current)
      msgTimer.current = setTimeout(() => send({ type: 'SET_MSG', msg: null }), MSG_TTL_MS)
    },
    [send],
  )

  const onQueryChange = useCallback(
    (value: string) => {
      send({ type: 'SET_QUERY', query: value })
      if (searchTimer.current) {
        clearTimeout(searchTimer.current)
        searchTimer.current = null
      }
      if (!value.trim()) {
        send({ type: 'SET_SEARCHING', searching: false })
        send({ type: 'SET_HITS', hits: [] })
        return
      }
      send({ type: 'SET_SEARCHING', searching: true })
      searchTimer.current = setTimeout(() => {
        searchTimer.current = null
        apiFetch<{ users: UserHit[] }>(`/api/users?q=${encodeURIComponent(value)}`)
          .then((r) => send({ type: 'SET_HITS', hits: r.users }))
          .catch(() => send({ type: 'SET_HITS', hits: [] }))
          .finally(() => send({ type: 'SET_SEARCHING', searching: false }))
      }, 250)
    },
    [send],
  )

  const onCopyInvite = useCallback(async () => {
    if (!inviteLink) return
    if (navigator.share) {
      await navigator
        .share({
          title: 'Join me on MemeOn',
          text: 'Memes are the new trading cards — join me on MemeOn!',
          url: inviteLink,
        })
        .catch(() => {})
      return
    }
    await navigator.clipboard.writeText(inviteLink)
    send({ type: 'SET_COPIED', copied: true })
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => send({ type: 'SET_COPIED', copied: false }), 2500)
  }, [inviteLink, send])

  const onRequest = useCallback(
    async (userId: string) => {
      send({ type: 'SET_MSG', msg: null })
      send({ type: 'SET_ACTION_ERR', err: null })
      send({ type: 'SET_PENDING', sub: userId })
      try {
        await post('/api/friends/request', { userId })
        flashMsg('Friend request sent 👋')
        onQueryChange('')
        load()
      } catch {
        send({ type: 'SET_ACTION_ERR', err: "Couldn't send that friend request. Try again in a moment." })
      } finally {
        send({ type: 'SET_PENDING', sub: null })
      }
    },
    [flashMsg, load, onQueryChange, send],
  )

  const onRespond = useCallback(
    async (userId: string, accept: boolean) => {
      send({ type: 'SET_ACTION_ERR', err: null })
      send({ type: 'SET_PENDING', sub: userId })
      try {
        await post('/api/friends/respond', { userId, accept })
        load()
      } catch {
        send({ type: 'SET_ACTION_ERR', err: "Couldn't update that request. Try again." })
      } finally {
        send({ type: 'SET_PENDING', sub: null })
      }
    },
    [load, send],
  )

  const onRemove = useCallback(
    async (userId: string) => {
      send({ type: 'SET_ACTION_ERR', err: null })
      send({ type: 'SET_PENDING', sub: userId })
      try {
        await post('/api/friends/remove', { userId })
        load()
      } catch {
        send({ type: 'SET_ACTION_ERR', err: "Couldn't remove that friend. Try again." })
      } finally {
        send({ type: 'SET_PENDING', sub: null })
      }
    },
    [load, send],
  )

  const onConfirmRemoval = useCallback(() => {
    const removal = actor.getSnapshot().context.pendingRemoval
    send({ type: 'CLOSE_REMOVE' })
    if (!removal) return
    if (removal.kind === 'decline') void onRespond(removal.sub, false)
    else void onRemove(removal.sub)
  }, [actor, onRemove, onRespond, send])

  const closeGift = useCallback(() => send({ type: 'CLOSE_GIFT' }), [send])

  const onGiftOpen = useCallback(
    (friend: GiftTarget) => {
      send({ type: 'OPEN_GIFT', recipient: friend })
      apiFetch<{ memes: Meme[] }>('/api/binder')
        .then((r) => send({ type: 'SET_GIFT_MEMES', memes: r.memes.filter((m) => (m.myShares ?? 0) > 0) }))
        .catch(() => send({ type: 'SET_GIFT_MEMES', memes: [] }))
    },
    [send],
  )

  const onGiftSubmit = useCallback(async () => {
    const live = actor.getSnapshot().context
    if (live.giftBusy || !live.giftPick || !live.gifting) return
    const giftShares = clampGiftShares(
      live.giftSharesInput ?? live.giftShares,
      Math.max(1, live.giftPick.myShares ?? 1),
    )
    send({ type: 'SET_GIFT_BUSY', busy: true })
    send({ type: 'SET_GIFT_ERR', err: null })
    try {
      await post('/api/gift', { memeId: live.giftPick.id, toSub: live.gifting.sub, shares: giftShares })
      flashMsg(
        `🎁 Gifted ${giftShares} share${giftShares === 1 ? '' : 's'} of "${live.giftPick.title}" to ${live.gifting.name}`,
      )
      closeGift()
    } catch (e) {
      send({ type: 'SET_GIFT_ERR', err: e instanceof Error ? e.message : 'That gift did not go through. Try again.' })
    } finally {
      send({ type: 'SET_GIFT_BUSY', busy: false })
    }
  }, [actor, closeGift, flashMsg, send])

  const showLoading = phase === 'loading'
  const showError = phase === 'error'
  const showEmpty = phase === 'empty'
  const showCircle = phase === 'ready' && accepted.length > 0
  const showCircleHint = phase === 'ready' && accepted.length === 0
  const trimmedQuery = ctx.query.trim()
  const showSearchPanel = trimmedQuery.length > 0
  const busySub = ctx.pendingSub

  const searchInputProps: Pick<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'aria-label'
  > = {
    value: ctx.query,
    onChange: ((event) => onQueryChange(event.target.value)) as ChangeEventHandler<HTMLInputElement>,
    'aria-label': 'Find people by name',
  }
  const friendLink = buildFriendLinkModel
  const giftMaxShares = Math.max(1, ctx.giftPick?.myShares ?? 1)
  const giftDialog = buildGiftDialogModel({
    open: !!ctx.gifting,
    recipient: ctx.gifting,
    memes: ctx.giftMemes,
    query: ctx.giftQuery,
    pick: ctx.giftPick,
    shares: ctx.giftShares,
    sharesInput: ctx.giftSharesInput,
    busy: ctx.giftBusy,
    error: ctx.giftErr,
    onClose: closeGift,
    onQueryChange: (query) => send({ type: 'SET_GIFT_QUERY', query }),
    onPick: (pick) => send({ type: 'SET_GIFT_PICK', pick }),
    onSharesChange: (rawValue) => {
      send({ type: 'SET_GIFT_SHARES_INPUT', value: rawValue })
      if (rawValue.trim()) send({ type: 'SET_GIFT_SHARES', shares: clampGiftShares(rawValue, giftMaxShares) })
    },
    onSharesBlur: () => send({ type: 'SET_GIFT_SHARES_INPUT', value: null }),
    onSubmit: onGiftSubmit,
  })
  const removal = ctx.pendingRemoval
  const removalCopy = REMOVAL_COPY[removal?.kind ?? 'remove']
  const removeDialog = buildConfirmDialogModel({
    id: 'friends-remove',
    open: !!removal,
    danger: true,
    title: removalCopy.title(removal?.name ?? ''),
    message: removalCopy.message,
    confirmLabel: removalCopy.confirmLabel,
    cancelLabel: removalCopy.cancelLabel,
    onConfirm: onConfirmRemoval,
    onCancel: () => send({ type: 'CLOSE_REMOVE' }),
  })

  return {
    phase,
    searchInputProps,
    msg: ctx.msg,
    err: ctx.actionErr,
    inviteLabel: ctx.copied ? 'Invite link copied ✓' : '💌 Invite a friend',
    inviteButtonProps: { onClick: onCopyInvite },
    onlineFriends: onlineFriends.map(friendLink),
    hits: ctx.hits.map((hit) => ({
      ...friendLink(hit),
      requestButtonProps: {
        onClick: () => onRequest(hit.sub),
        /* WCAG 2.5.3: the button's visible words lead its accessible name */
        'aria-label': `Add friend — send ${hit.name} a friend request`,
        disabled: busySub === hit.sub,
        'aria-busy': busySub === hit.sub,
      },
    })),
    incoming: incoming.map((friend) => ({
      ...friendLink(friend),
      acceptButtonProps: {
        onClick: () => onRespond(friend.sub, true),
        'aria-label': `Accept ${friend.name}'s request`,
        disabled: busySub === friend.sub,
        'aria-busy': busySub === friend.sub,
      },
      declineButtonProps: {
        onClick: () => send({ type: 'ASK_REMOVE', removal: { sub: friend.sub, name: friend.name, kind: 'decline' } }),
        'aria-label': `Decline ${friend.name}'s request`,
        disabled: busySub === friend.sub,
        'aria-busy': busySub === friend.sub,
      },
    })),
    outgoing: outgoing.map((friend) => ({
      ...friendLink(friend),
      pendingLabel: 'Pending',
      cancelButtonProps: {
        onClick: () => onRemove(friend.sub),
        'aria-label': `Cancel your request to ${friend.name}`,
        disabled: busySub === friend.sub,
        'aria-busy': busySub === friend.sub,
      },
    })),
    accepted: accepted.map((friend) => ({
      ...friendLink(friend),
      isOnline: ctx.onlineSubs.includes(friend.sub),
      onlineLabel: 'Online now',
      statsLabel: `📚 ${friend.collectionSize} memes · 🧠 ${friend.portfolioValue.toLocaleString()} portfolio`,
      giftLabel: 'Gift',
      giftButtonProps: {
        onClick: () => onGiftOpen({ sub: friend.sub, name: friend.name }),
        'aria-label': `Gift shares to ${friend.name}`,
        disabled: busySub === friend.sub,
      },
      removeLabel: 'Remove',
      removeButtonProps: {
        onClick: () => send({ type: 'ASK_REMOVE', removal: { sub: friend.sub, name: friend.name, kind: 'remove' } }),
        'aria-label': `Remove ${friend.name}`,
        disabled: busySub === friend.sub,
        'aria-busy': busySub === friend.sub,
      },
    })),
    showMsg: !!ctx.msg,
    showErr: !!ctx.actionErr,
    showOnline: onlineFriends.length > 0,
    showSearchPanel,
    // results stay clickable while the next query debounces; only an empty list swaps to a state line
    showSearching: showSearchPanel && ctx.searching && ctx.hits.length === 0,
    showHits: showSearchPanel && ctx.hits.length > 0,
    showNoHits: showSearchPanel && !ctx.searching && ctx.hits.length === 0,
    showIncoming: incoming.length > 0,
    showOutgoing: outgoing.length > 0,
    showLoading,
    showError,
    showEmpty,
    showCircle,
    showCircleHint,
    searchingLabel: 'Searching…',
    noHitsMessage: `No one goes by "${trimmedQuery}" — check the spelling, or invite them.`,
    loadingLabel: 'Loading friends…',
    errorTitle: "Couldn't load your friends.",
    errorMessage: ctx.err ?? 'Check your connection and try again.',
    retryLabel: 'Retry',
    retryButtonProps: { onClick: load },
    emptyTitle: 'No friends yet',
    emptyMessage:
      "Invite someone and you can gift shares straight from your binder and watch each other's portfolios.",
    emptyActionProps: { onClick: onCopyInvite },
    circleHintMessage:
      incoming.length > 0
        ? 'Accept a request to start your circle.'
        : 'No one has accepted yet — your sent requests are still out there.',
    giftDialog,
    removeDialog,
  }
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
