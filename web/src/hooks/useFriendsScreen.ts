import { useProjectedActor } from './useProjectedActor'
import { useCallback, useRef } from 'react'
import { friendsCopy } from '../copy/friends'
import { useAuth } from './useAuth'
import { apiFetch, post } from '../lib/api'
import { watchPresence, type PresenceWatch } from '../lib/presence'
import type { FriendEntry, Meme } from '../lib/types'
import {
  friendsMachine,
  type FriendsPhase,
  type GiftTarget,
  type UserHit,
} from '../stores/friendsMachine'
import { useMountEffect } from './useMountEffect'
import { clampGiftShares } from '../lib/giftDialogModel'
import {
  buildFriendsScreenModel,
  type FriendsScreenModel,
} from '../lib/friendsModel'

export type { FriendsPhase }
export type { FriendLinkModel, FriendsScreenModel } from '../lib/friendsModel'
export { buildFriendLinkModel } from '../lib/friendsModel'

/** Success banners clear themselves so they stop stacking up for the whole session. */
const MSG_TTL_MS = 6000

const copy = friendsCopy

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
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
      .catch(() => send({ type: 'FAIL', err: copy.loadError.body }))
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
      send({ type: 'SET_SEARCH_ERR', err: null })
      searchTimer.current = setTimeout(() => {
        searchTimer.current = null
        apiFetch<{ users: UserHit[] }>(`/api/users?q=${encodeURIComponent(value)}`)
          .then((r) => send({ type: 'SET_HITS', hits: r.users }))
          .catch(() => send({ type: 'SET_SEARCH_ERR', err: copy.search.failed }))
          .finally(() => send({ type: 'SET_SEARCHING', searching: false }))
      }, 250)
    },
    [send],
  )

  const onCopyInvite = useCallback(async () => {
    if (!inviteLink) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: copy.invite.share.title,
          text: copy.invite.share.text,
          url: inviteLink,
        })
        return
      } catch (error) {
        if (isAbortError(error)) return
      }
    }
    const write = navigator.clipboard?.writeText
    if (!write) {
      send({ type: 'SET_COPIED', copied: false, failed: true })
      return
    }
    try {
      await write(inviteLink)
      send({ type: 'SET_COPIED', copied: true })
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => send({ type: 'SET_COPIED', copied: false }), 2500)
    } catch {
      send({ type: 'SET_COPIED', copied: false, failed: true })
    }
  }, [inviteLink, send])

  const onRequest = useCallback(
    async (userId: string) => {
      send({ type: 'SET_MSG', msg: null })
      send({ type: 'SET_ACTION_ERR', err: null })
      send({ type: 'SET_PENDING', sub: userId })
      try {
        await post('/api/friends/request', { userId })
        flashMsg(copy.toasts.requestSent)
        onQueryChange('')
        load()
      } catch {
        send({ type: 'SET_ACTION_ERR', err: copy.errors.request })
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
        send({ type: 'SET_ACTION_ERR', err: copy.errors.respond })
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
        send({ type: 'SET_ACTION_ERR', err: copy.errors.remove })
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
      flashMsg(copy.toasts.gifted(giftShares, live.giftPick.title, live.gifting.name))
      send({ type: 'CLOSE_GIFT' })
    } catch (e) {
      send({ type: 'SET_GIFT_ERR', err: e instanceof Error ? e.message : copy.errors.gift })
    } finally {
      send({ type: 'SET_GIFT_BUSY', busy: false })
    }
  }, [actor, flashMsg, send])

  return buildFriendsScreenModel(phase, ctx, {
    onQueryChange,
    onCopyInvite,
    onRequest,
    onRespond,
    onRemove,
    onGiftOpen,
    onGiftSubmit,
    onGiftClose: () => send({ type: 'CLOSE_GIFT' }),
    onGiftQueryChange: (query) => send({ type: 'SET_GIFT_QUERY', query }),
    onGiftPick: (pick) => send({ type: 'SET_GIFT_PICK', pick }),
    onGiftSharesInput: (value) => send({ type: 'SET_GIFT_SHARES_INPUT', value }),
    onGiftShares: (shares) => send({ type: 'SET_GIFT_SHARES', shares }),
    onGiftSharesBlur: () => send({ type: 'SET_GIFT_SHARES_INPUT', value: null }),
    onAskRemove: (removal) => send({ type: 'ASK_REMOVE', removal }),
    onConfirmRemoval,
    onCancelRemove: () => send({ type: 'CLOSE_REMOVE' }),
    onLoad: load,
  })
}
