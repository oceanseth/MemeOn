import { useMachine } from '@xstate/react'
import { useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import type { Meme, Memeplex, Position } from '../lib/types'
import {
  memeDetailMachine,
  type MemeDetailPhase,
  type MemeStats,
} from '../stores/memeDetailMachine'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

const ARCHIVE_SUB = 'meme_archive'
const nameCache = new Map<string, string>()

export interface CapRow {
  userId: string
  shares: number
  label: string
}

export interface MemeDetailScreenModel {
  phase: MemeDetailPhase
  meme: Meme | null
  stats: MemeStats | null
  capTable: CapRow[]
  msg: string | null
  err: string | null
  copied: boolean
  confirmingDelete: boolean
  deleting: boolean
  price: number
  sellShares: number
  buyShares: number
  plex: Memeplex | null
  plexBinder: Meme[]
  plexPick: string
  plexPasted: string
  plexMsg: string | null
  shareUrl: string
  myShares: number
  isSeller: boolean
  showNotFound: boolean
  showLoading: boolean
  showUserActions: boolean
  showClaim: boolean
  showVisibility: boolean
  showDelete: boolean
  canEditPlex: boolean
  onCopyShare: () => void
  onRemix: () => void
  onClaim: () => void
  onToggleVisibility: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  onBuySharesChange: (n: number) => void
  onBuy: () => void
  onUnlist: () => void
  onSellSharesChange: (n: number) => void
  onPriceChange: (n: number) => void
  onList: () => void
  onPlexPickChange: (id: string) => void
  onPlexPastedChange: (raw: string) => void
  onPlexAdd: (memeId: string) => void
}

function holderLabel(
  userId: string,
  meSub: string | null,
  names: Record<string, string>,
): string {
  if (meSub && userId === meSub) return 'You'
  return names[userId] ?? nameCache.get(userId) ?? `${userId.slice(0, 10)}…`
}

/** Everything `MemeDetailScreen` renders. The hook is the engine; the screen is the terminal. */
export function useMemeDetailScreen(): MemeDetailScreenModel {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [snapshot, send, actor] = useMachine(memeDetailMachine, {
    input: { id: id ?? null },
  })
  const userRef = useRef(user)
  userRef.current = user
  const binderAttempt = useRef<string | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ctx = snapshot.context
  const phase = snapshot.value as MemeDetailPhase
  const meme = ctx.meme
  const myShares = ctx.positions.find((p) => p.userId === user?.sub)?.shares ?? 0
  const isSeller = meme?.listing?.sellerId === user?.sub

  const resolveHolderNames = useCallback(
    (positions: Position[], meSub: string | null) => {
      for (const p of positions) {
        if (meSub && p.userId === meSub) continue
        if (nameCache.has(p.userId)) {
          send({ type: 'SET_HOLDER_NAME', sub: p.userId, name: nameCache.get(p.userId)! })
          continue
        }
        apiFetch<{ users: { sub: string; name: string }[] }>('/api/users?q=')
          .then((r) => {
            const hit = r.users.find((u) => u.sub === p.userId)
            if (hit) {
              nameCache.set(hit.sub, hit.name)
              send({ type: 'SET_HOLDER_NAME', sub: hit.sub, name: hit.name })
            }
          })
          .catch(() => {})
      }
    },
    [send],
  )

  const loadBinder = useCallback(
    (loaded: Meme, positions: Position[], me: { sub: string } | null) => {
      if (!me) return
      const shares = positions.find((p) => p.userId === me.sub)?.shares ?? 0
      if (loaded.creatorId !== me.sub && shares <= 0) return
      const token = `${loaded.id}:${me.sub}`
      if (binderAttempt.current === token) return
      binderAttempt.current = token
      apiFetch<{ memes: Meme[] }>('/api/binder')
        .then((r) => send({ type: 'SET_PLEX_BINDER', binder: r.memes.filter((m) => m.id !== loaded.id) }))
        .catch(() => {})
    },
    [send],
  )

  const load = useCallback(() => {
    const liveId = actor.getSnapshot().context.id
    if (!liveId) {
      send({ type: 'NOT_FOUND' })
      return
    }
    apiFetch<{ meme: Meme; positions: Position[] }>(`/api/memes/${liveId}`)
      .then((r) => {
        send({ type: 'LOADED', meme: r.meme, positions: r.positions })
        const me = userRef.current
        resolveHolderNames(r.positions, me?.sub ?? null)
        loadBinder(r.meme, r.positions, me)
      })
      .catch(() => send({ type: 'NOT_FOUND' }))
    apiFetch<MemeStats>(`/api/memes/${liveId}/stats`)
      .then((stats) => send({ type: 'SET_STATS', stats }))
      .catch(() => {})
  }, [actor, loadBinder, resolveHolderNames, send])

  useMountEffect(() => {
    load()
    const liveId = id ?? null
    if (liveId) {
      apiFetch<Memeplex>(`/api/memes/${liveId}/memeplex`)
        .then((plex) => send({ type: 'SET_PLEX', plex }))
        .catch(() => {})
    }
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  })

  if (meme && user) loadBinder(meme, ctx.positions, user)

  const act = useCallback(
    async (fn: () => Promise<unknown>, okMsg: string, kind?: 'list' | 'buy') => {
      if (kind === 'list') send({ type: 'LIST' })
      else if (kind === 'buy') send({ type: 'BUY' })
      try {
        await fn()
        send({ type: 'DONE', msg: okMsg })
        if (kind === 'list' || kind === 'buy') send({ type: 'SET_MSG', msg: okMsg })
        else send({ type: 'SET_MSG', msg: okMsg })
        load()
        void refresh()
      } catch (e) {
        send({ type: 'FAIL', err: e instanceof Error ? e.message : 'action failed' })
      }
    },
    [load, refresh, send],
  )

  const shareUrl = meme ? `${window.location.origin}/m/${meme.id}` : ''
  const showNotFound = phase === 'empty' || (phase === 'error' && !meme)
  const showLoading = !showNotFound && (phase === 'loading' || !meme)

  return {
    phase,
    meme,
    stats: ctx.stats,
    capTable: ctx.positions.map((p) => ({
      userId: p.userId,
      shares: p.shares,
      label: holderLabel(p.userId, user?.sub ?? null, ctx.holderNames),
    })),
    msg: ctx.msg,
    err: ctx.err,
    copied: ctx.copied,
    confirmingDelete: ctx.confirmingDelete,
    deleting: ctx.deleting || phase === 'deleting',
    price: ctx.price,
    sellShares: ctx.sellShares,
    buyShares: ctx.buyShares,
    plex: ctx.plex,
    plexBinder: ctx.plexBinder,
    plexPick: ctx.plexPick,
    plexPasted: ctx.plexPasted,
    plexMsg: ctx.plexMsg,
    shareUrl,
    myShares,
    isSeller: !!isSeller,
    showNotFound,
    showLoading,
    showUserActions: !!user,
    showClaim: !!user && !!meme && meme.creatorId === ARCHIVE_SUB,
    showVisibility: myShares === 100,
    showDelete: myShares === 100 && !!meme?.private,
    canEditPlex: !!user && !!meme && (meme.creatorId === user.sub || myShares > 0),
    onCopyShare: () => {
      if (!shareUrl) return
      void navigator.clipboard.writeText(shareUrl).then(() => {
        send({ type: 'SET_COPIED', copied: true })
        if (copyTimer.current) clearTimeout(copyTimer.current)
        copyTimer.current = setTimeout(() => send({ type: 'SET_COPIED', copied: false }), 2000)
      })
    },
    onRemix: () => {
      if (meme) navigate(`/binder/new?remix=${meme.id}`)
    },
    onClaim: () => {
      if (!meme) return
      const note = window.prompt('Tell us why this meme is yours (links help your case):')
      if (note !== null)
        void act(() => post(`/api/memes/${meme.id}/claim`, { note }), 'Claim filed 📼 — we’ll review it and transfer the card if it checks out.')
    },
    onToggleVisibility: () => {
      if (!meme) return
      void act(
        () => post(`/api/memes/${meme.id}/visibility`, { private: !meme.private }),
        meme.private
          ? 'Back on the marketplace 🌐'
          : 'Hidden from the marketplace 🙈 (still in your binder)',
      )
    },
    onAskDelete: () => send({ type: 'SET_CONFIRMING_DELETE', confirming: true }),
    onCancelDelete: () => send({ type: 'SET_CONFIRMING_DELETE', confirming: false }),
    onConfirmDelete: () => {
      const live = actor.getSnapshot().context.meme
      if (!live) return
      send({ type: 'DELETE' })
      void apiFetch(`/api/memes/${live.id}`, { method: 'DELETE' })
        .then(() => {
          send({ type: 'DONE' })
          navigate('/binder')
        })
        .catch((e) => send({ type: 'FAIL', err: e instanceof Error ? e.message : 'delete failed' }))
    },
    onBuySharesChange: (n) => send({ type: 'SET_BUY_SHARES', shares: n }),
    onBuy: () => {
      const live = actor.getSnapshot().context
      if (!live.meme) return
      void act(
        () => post(`/api/memes/${live.meme!.id}/buy`, { shares: live.buyShares }),
        'Shares acquired 💼',
        'buy',
      )
    },
    onUnlist: () => {
      const live = actor.getSnapshot().context.meme
      if (!live) return
      void act(() => post(`/api/memes/${live.id}/unlist`, {}), 'Delisted')
    },
    onSellSharesChange: (n) => send({ type: 'SET_SELL_SHARES', shares: n }),
    onPriceChange: (n) => send({ type: 'SET_PRICE', price: n }),
    onList: () => {
      const live = actor.getSnapshot().context
      if (!live.meme) return
      void act(
        () =>
          post(`/api/memes/${live.meme!.id}/list`, {
            shares: live.sellShares,
            pricePerShare: live.price,
          }),
        'Listed on the marketplace 🏷️',
        'list',
      )
    },
    onPlexPickChange: (pick) => send({ type: 'SET_PLEX_PICK', pick }),
    onPlexPastedChange: (pasted) => send({ type: 'SET_PLEX_PASTED', pasted }),
    onPlexAdd: (memeId) => {
      const live = actor.getSnapshot().context
      if (!live.meme) return
      const alreadyLinked = new Set([
        live.meme.id,
        ...(live.plex?.ancestors.map((m) => m.id) ?? []),
        ...(live.plex?.remixes.map((m) => m.id) ?? []),
        ...(live.plex?.related.map((m) => m.id) ?? []),
      ])
      if (alreadyLinked.has(memeId)) {
        send({
          type: 'SET_PLEX_MSG',
          msg:
            memeId === live.meme.id
              ? "That's this meme — already the center of its own memeplex."
              : 'Already in the memeplex.',
        })
        return
      }
      send({ type: 'SET_PLEX_MSG', msg: null })
      void post(`/api/memes/${live.meme.id}/memeplex`, { memeId })
        .then(() => {
          send({ type: 'SET_PLEX_MSG', msg: 'Added to the memeplex 🕸️' })
          send({ type: 'SET_PLEX_PICK', pick: '' })
          send({ type: 'SET_PLEX_PASTED', pasted: '' })
          return apiFetch<Memeplex>(`/api/memes/${live.meme!.id}/memeplex`).then((plex) =>
            send({ type: 'SET_PLEX', plex }),
          )
        })
        .catch((e) => {
          send({ type: 'SET_PLEX_MSG', msg: e instanceof Error ? e.message : 'failed to add' })
        })
    },
  }
}
