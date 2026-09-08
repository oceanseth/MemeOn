import { useMachine } from '@xstate/react'
import { useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import { apiFetch, post } from '../lib/api'
import { watchPresence } from '../lib/presence'
import type { FriendEntry, Meme } from '../lib/types'
import {
  friendsMachine,
  type FriendsPhase,
  type GiftTarget,
  type UserHit,
} from '../stores/friendsMachine'
import { useMountEffect } from './useMountEffect'

export type { FriendsPhase, GiftTarget, UserHit }

export interface FriendsScreenModel {
  phase: FriendsPhase
  query: string
  hits: UserHit[]
  msg: string | null
  inviteLabel: string
  onlineFriends: FriendEntry[]
  incoming: FriendEntry[]
  outgoing: FriendEntry[]
  accepted: FriendEntry[]
  onlineSubs: string[]
  showMsg: boolean
  showOnline: boolean
  showHits: boolean
  showIncoming: boolean
  showLoading: boolean
  showEmpty: boolean
  showCircle: boolean
  emptyMessage: string
  gifting: GiftTarget | null
  giftMemes: Meme[]
  giftQuery: string
  giftPick: Meme | null
  giftShares: number
  giftBusy: boolean
  giftErr: string | null
  giftOpen: boolean
  onQueryChange: (q: string) => void
  onCopyInvite: () => void
  onRequest: (userId: string) => void
  onRespond: (userId: string, accept: boolean) => void
  onRemove: (userId: string) => void
  onGiftOpen: (friend: GiftTarget) => void
  onGiftQueryChange: (q: string) => void
  onGiftPick: (m: Meme) => void
  onGiftSharesChange: (n: number) => void
  onGiftClose: () => void
  onGiftSubmit: () => void
}

/** Everything `FriendsScreen` renders. The hook is the engine; the screen is the terminal. */
export function useFriendsScreen(): FriendsScreenModel {
  const { user } = useAuth()
  const [snapshot, send, actor] = useMachine(friendsMachine)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ctx = snapshot.context
  const phase = snapshot.value as FriendsPhase

  const load = useCallback(() => {
    apiFetch<{ friends: FriendEntry[] }>('/api/friends')
      .then((r) => send({ type: 'DONE', friends: r.friends }))
      .catch(() => send({ type: 'DONE', friends: [] }))
  }, [send])

  useMountEffect(() => {
    load()
    const stop = watchPresence((online) => send({ type: 'SET_ONLINE', onlineSubs: [...online] }))
    return () => {
      stop()
      if (searchTimer.current) clearTimeout(searchTimer.current)
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  })

  const inviteLink = user ? `${window.location.origin}/invite/${encodeURIComponent(user.sub)}` : ''

  const incoming = ctx.friends.filter((f) => f.status === 'incoming')
  const outgoing = ctx.friends.filter((f) => f.status === 'outgoing')
  const accepted = ctx.friends.filter((f) => f.status === 'accepted')
  const onlineFriends = accepted.filter((f) => ctx.onlineSubs.includes(f.sub))

  const onQueryChange = useCallback(
    (value: string) => {
      send({ type: 'SET_QUERY', query: value })
      if (searchTimer.current) clearTimeout(searchTimer.current)
      if (!value.trim()) {
        send({ type: 'SET_HITS', hits: [] })
        return
      }
      searchTimer.current = setTimeout(() => {
        apiFetch<{ users: UserHit[] }>(`/api/users?q=${encodeURIComponent(value)}`)
          .then((r) => send({ type: 'SET_HITS', hits: r.users }))
          .catch(() => send({ type: 'SET_HITS', hits: [] }))
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
      try {
        await post('/api/friends/request', { userId })
        send({ type: 'SET_MSG', msg: 'Friend request sent 👋' })
        send({ type: 'SET_QUERY', query: '' })
        send({ type: 'SET_HITS', hits: [] })
        load()
      } catch (e) {
        send({ type: 'SET_MSG', msg: e instanceof Error ? e.message : 'request failed' })
      }
    },
    [load, send],
  )

  const onRespond = useCallback(
    async (userId: string, accept: boolean) => {
      await post('/api/friends/respond', { userId, accept }).catch(() => {})
      load()
    },
    [load],
  )

  const onRemove = useCallback(
    async (userId: string) => {
      await post('/api/friends/remove', { userId }).catch(() => {})
      load()
    },
    [load],
  )

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
    if (!live.giftPick || !live.gifting) return
    send({ type: 'SET_GIFT_BUSY', busy: true })
    send({ type: 'SET_GIFT_ERR', err: null })
    try {
      await post('/api/gift', { memeId: live.giftPick.id, toSub: live.gifting.sub, shares: live.giftShares })
      send({
        type: 'SET_MSG',
        msg: `🎁 Gifted ${live.giftShares} share${live.giftShares === 1 ? '' : 's'} of "${live.giftPick.title}" to ${live.gifting.name}`,
      })
      send({ type: 'CLOSE_GIFT' })
    } catch (e) {
      send({ type: 'SET_GIFT_ERR', err: e instanceof Error ? e.message : 'gift failed' })
    } finally {
      send({ type: 'SET_GIFT_BUSY', busy: false })
    }
  }, [actor, send])

  const showLoading = phase === 'loading'
  const showError = phase === 'error'
  const showEmpty = phase === 'empty' || showError
  const emptyMessage = showError
    ? (ctx.err ?? 'could not load friends')
    : 'No friends yet. Search above and build your trading circle.'

  return {
    phase,
    query: ctx.query,
    hits: ctx.hits,
    msg: ctx.msg,
    inviteLabel: ctx.copied ? 'Invite link copied ✓' : '💌 Invite a friend',
    onlineFriends,
    incoming,
    outgoing,
    accepted,
    onlineSubs: ctx.onlineSubs,
    showMsg: !!ctx.msg,
    showOnline: onlineFriends.length > 0,
    showHits: ctx.hits.length > 0,
    showIncoming: incoming.length > 0,
    showLoading,
    showEmpty,
    showCircle: phase === 'ready',
    emptyMessage,
    gifting: ctx.gifting,
    giftMemes: ctx.giftMemes,
    giftQuery: ctx.giftQuery,
    giftPick: ctx.giftPick,
    giftShares: ctx.giftShares,
    giftBusy: ctx.giftBusy,
    giftErr: ctx.giftErr,
    giftOpen: !!ctx.gifting,
    onQueryChange,
    onCopyInvite,
    onRequest,
    onRespond,
    onRemove,
    onGiftOpen,
    onGiftQueryChange: (q) => send({ type: 'SET_GIFT_QUERY', query: q }),
    onGiftPick: (m) => send({ type: 'SET_GIFT_PICK', pick: m }),
    onGiftSharesChange: (n) => send({ type: 'SET_GIFT_SHARES', shares: n }),
    onGiftClose: () => send({ type: 'CLOSE_GIFT' }),
    onGiftSubmit,
  }
}
