import { useProjectedActor } from './useProjectedActor'
import { useCallback, useRef, type ChangeEventHandler } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { memeDetailCopy } from '../copy/memeDetail'
import { apiFetch, post } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
import { createDetailBinderGate } from '../lib/detailBinderGate'
import { buildMemeDetailModel, type MemeDetailScreenModel } from '../lib/memeDetailModel'
import type { Meme, Memeplex, Position } from '../lib/types'
import { clampPrice, clampShares, memeDetailMachine, type MemeDetailPhase, type MemeStats } from '../stores/memeDetailMachine'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { useStores } from '../stores/StoresContext'

export {
  buildTierLadderModel,
  type CapRow,
  type DetailActionModel,
  type DetailLiveRegionProps,
  type DetailListModel,
  type DetailListingModel,
  type DetailNotFoundModel,
  type DetailSignedOutModel,
  type DetailSourceModel,
  type DetailTierLadderModel,
  type MemeDetailModel,
  type MemeDetailScreenModel,
} from '../lib/memeDetailModel'

const copy = memeDetailCopy

function numberFromInput(event: React.ChangeEvent<HTMLInputElement>): number { return Number(event.target.value) }

/** Detail loading, auth-aware binder access, user actions, and element props. */
export function useMemeDetailScreen(): MemeDetailScreenModel {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const { auth } = useStores()
  const [snapshot, send, actor] = useProjectedActor(memeDetailMachine, { input: { id: id ?? null } })
  const holderNameCache = useRef(new Map<string, string>())
  const holderNamesRequested = useRef(false)
  const binderGate = useRef(createDetailBinderGate())
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const context = snapshot.context
  const phase = snapshot.value as MemeDetailPhase

  // one directory lookup per mount resolves every holder: the cap table used to fire an identical
  // request per unknown holder (20 holders → 20 concurrent identical requests).
  const resolveHolderNames = useCallback((positions: Position[], meSub: string | null) => {
    if (holderNamesRequested.current) return
    const unknown = positions.filter((position) => !(meSub && position.userId === meSub) && !holderNameCache.current.has(position.userId))
    if (unknown.length === 0) return
    holderNamesRequested.current = true
    apiFetch<{ users: { sub: string; name: string }[] }>('/api/users?q=')
      .then((result) => {
        const names: Record<string, string> = {}
        for (const candidate of result.users) {
          if (!unknown.some((position) => position.userId === candidate.sub)) continue
          holderNameCache.current.set(candidate.sub, candidate.name)
          names[candidate.sub] = candidate.name
        }
        if (Object.keys(names).length > 0) send({ type: 'SET_HOLDER_NAMES', names })
      })
      // keep clearing the in-flight flag so a later load can retry; the cap table stays copy.holder.unknown
      .catch(() => { holderNamesRequested.current = false })
  }, [send])

  const load = useCallback(() => {
    const memeId = actor.getSnapshot().context.id
    if (!memeId) { send({ type: 'NOT_FOUND' }); return }
    apiFetch<{ meme: Meme; positions: Position[] }>(`/api/memes/${memeId}`)
      .then((result) => { send({ type: 'LOADED', meme: result.meme, positions: result.positions }); resolveHolderNames(result.positions, auth.user?.sub ?? null) })
      .catch(() => send({ type: 'NOT_FOUND' }))
    // sources are additive; the spreading card hides when sources.length===0 — do not FAIL the page
    apiFetch<MemeStats>(`/api/memes/${memeId}/stats`).then((stats) => send({ type: 'SET_STATS', stats })).catch(() => {})
  }, [actor, auth, resolveHolderNames, send])

  useMountEffect(() => {
    let installed = true
    const loadBinderWhenEligible = () => {
      const live = actor.getSnapshot().context
      const meme = live.meme
      const me = auth.user
      if (!meme || !me) return
      if (!binderGate.current.shouldLoad(meme, live.positions, me.sub)) return
      apiFetch<{ memes: Meme[] }>('/api/binder')
        .then((result) => {
          const current = actor.getSnapshot().context.meme
          if (installed && current?.id === meme.id && auth.user?.sub === me.sub) {
            send({ type: 'SET_PLEX_BINDER', binder: result.memes.filter((candidate) => candidate.id !== meme.id) })
          }
        })
        // empty picker ≡ one-card binder; paste-a-link still works
        .catch(() => {})
    }
    const unsubscribeActor = actor.subscribe(loadBinderWhenEligible)
    loadBinderWhenEligible()
    const disposeAuth = auth.subscribe(loadBinderWhenEligible)
    load()
    const memeId = actor.getSnapshot().context.id
    if (memeId) apiFetch<Memeplex>(`/api/memes/${memeId}/memeplex`).then((plex) => send({ type: 'SET_PLEX', plex })).catch(() => send({ type: 'SET_PLEX_ERR', err: copy.memeplex.loadFailed }))
    return () => { installed = false; unsubscribeActor.unsubscribe(); disposeAuth(); if (copyTimer.current) clearTimeout(copyTimer.current) }
  })

  const act = useCallback(async (operation: () => Promise<unknown>, message: string, kind?: 'list' | 'buy') => {
    if (kind === 'list') send({ type: 'LIST' })
    else if (kind === 'buy') send({ type: 'BUY' })
    try {
      await operation()
      send({ type: 'DONE', msg: message })
      send({ type: 'SET_MSG', msg: message })
      load()
      void refresh()
    }
    catch (error) { send({ type: 'FAIL', err: error instanceof Error ? error.message : copy.errors.action }) }
  }, [load, refresh, send])

  const meme = context.meme
  const shareUrl = meme ? `${window.location.origin}/m/${meme.id}` : ''
  const showNotFound = phase === 'empty' || (phase === 'error' && !meme)
  const showLoading = !showNotFound && (phase === 'loading' || !meme)
  const screen = {
    phase, showNotFound, showLoading,
    notFound: { message: copy.notFound.message, linkProps: { to: '/marketplace' }, linkLabel: copy.notFound.browse },
    loadingLabel: copy.loading,
  }
  if (!meme) return { ...screen, detail: null }

  const buySharesChange: ChangeEventHandler<HTMLInputElement> = (event) => send({ type: 'SET_BUY_SHARES', shares: numberFromInput(event) })
  const sellSharesChange: ChangeEventHandler<HTMLInputElement> = (event) => send({ type: 'SET_SELL_SHARES', shares: numberFromInput(event) })
  const priceChange: ChangeEventHandler<HTMLInputElement> = (event) => send({ type: 'SET_PRICE', price: numberFromInput(event) })
  const onCopy = () => {
    if (!shareUrl) return
    const write = navigator.clipboard?.writeText
    if (!write) {
      send({ type: 'SET_COPIED', copied: false, failed: true })
      return
    }
    void write(shareUrl).then(() => {
      send({ type: 'SET_COPIED', copied: true })
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => send({ type: 'SET_COPIED', copied: false }), 2000)
    }).catch(() => send({ type: 'SET_COPIED', copied: false, failed: true }))
  }
  const onPlexAdd = (memeId: string) => {
    const live = actor.getSnapshot().context
    if (!live.meme) return
    const linked = new Set([live.meme.id, ...(live.plex?.ancestors.map((candidate) => candidate.id) ?? []), ...(live.plex?.remixes.map((candidate) => candidate.id) ?? []), ...(live.plex?.related.map((candidate) => candidate.id) ?? [])])
    if (linked.has(memeId)) { send({ type: 'SET_PLEX_ERR', err: memeId === live.meme.id ? copy.memeplex.isThisMeme : copy.memeplex.alreadyLinked }); return }
    send({ type: 'SET_PLEX_MSG', msg: null })
    void post(`/api/memes/${live.meme.id}/memeplex`, { memeId }).then(() => {
      send({ type: 'SET_PLEX_MSG', msg: copy.memeplex.added }); send({ type: 'SET_PLEX_PICK', pick: '' }); send({ type: 'SET_PLEX_PASTED', pasted: '' })
      return apiFetch<Memeplex>(`/api/memes/${live.meme!.id}/memeplex`).then((plex) => send({ type: 'SET_PLEX', plex }))
    }).catch((error) => send({ type: 'SET_PLEX_ERR', err: error instanceof Error ? error.message : copy.memeplex.addFailed }))
  }
  const myShares = context.positions.find((position) => position.userId === user?.sub)?.shares ?? 0
  const runBuy = () => void act(() => post(`/api/memes/${meme.id}/buy`, { shares: clampShares(actor.getSnapshot().context.buyShares, meme.listing?.shares ?? 100) }), copy.toasts.bought, 'buy')

  return {
    ...screen,
    detail: buildMemeDetailModel({
      phase, context, meme, user, shareUrl, holderNameCache: holderNameCache.current,
      actions: {
        onBuySharesChange: buySharesChange,
        onSellSharesChange: sellSharesChange,
        onPriceChange: priceChange,
        onCopy, onPlexAdd,
        onPlexPickChange: (pick) => send({ type: 'SET_PLEX_PICK', pick }),
        onPlexPastedChange: (pasted) => send({ type: 'SET_PLEX_PASTED', pasted }),
        onRemix: () => navigate(`/binder/new?remix=${meme.id}`),
        onLogin: () => { send({ type: 'LOGIN_START' }); void beginMaskyLogin().catch((error) => send({ type: 'LOGIN_FAIL', err: error instanceof Error ? error.message : copy.errors.login })) },
        onStartClaim: () => send({ type: 'SET_CONFIRMING_CLAIM', confirming: true }),
        onStartDelete: () => send({ type: 'SET_CONFIRMING_DELETE', confirming: true }),
        onToggleVisibility: () => void act(() => post(`/api/memes/${meme.id}/visibility`, { private: !meme.private }), meme.private ? copy.toasts.madePublic : copy.toasts.madePrivate),
        onUnlist: () => void act(() => post(`/api/memes/${meme.id}/unlist`, {}), copy.toasts.delisted),
        onList: () => void act(() => post(`/api/memes/${meme.id}/list`, { shares: clampShares(actor.getSnapshot().context.sellShares, Math.max(1, myShares)), pricePerShare: clampPrice(actor.getSnapshot().context.price) }), copy.toasts.listed, 'list'),
        requestBuyConfirm: () => send({ type: 'SET_CONFIRMING_BUY', confirming: true }),
        runBuy,
        onDeleteCancel: () => send({ type: 'SET_CONFIRMING_DELETE', confirming: false }),
        onDeleteConfirm: () => {
          const live = actor.getSnapshot().context.meme
          if (!live) return
          send({ type: 'DELETE' })
          void apiFetch(`/api/memes/${live.id}`, { method: 'DELETE' }).then(() => { send({ type: 'DONE' }); navigate('/binder') }).catch((error) => send({ type: 'FAIL', err: error instanceof Error ? error.message : copy.errors.delete }))
        },
        onBuyCancel: () => send({ type: 'SET_CONFIRMING_BUY', confirming: false }),
        onClaimCancel: () => send({ type: 'SET_CONFIRMING_CLAIM', confirming: false }),
        onClaimConfirm: () => {
          const note = actor.getSnapshot().context.claimNote
          send({ type: 'SET_CONFIRMING_CLAIM', confirming: false })
          void act(() => post(`/api/memes/${meme.id}/claim`, { note }), copy.toasts.claimed)
        },
        onClaimNoteChange: (note) => send({ type: 'SET_CLAIM_NOTE', note }),
      },
    }),
  }
}
