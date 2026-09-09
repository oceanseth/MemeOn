import { useProjectedActor } from './useProjectedActor'
import { autorun } from 'mobx'
import { createElement, Fragment, useCallback, useRef, type ChangeEventHandler } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { buildConfirmDialogModel, type ConfirmDialogModel } from '../lib/confirmDialogModel'
import { createDetailBinderGate } from '../lib/detailBinderGate'
import type { Meme, Memeplex, Position } from '../lib/types'
import { memeDetailMachine, type MemeDetailPhase, type MemeStats } from '../stores/memeDetailMachine'
import { buildMemeplexPanelModel, type MemeplexPanelModel } from '../organisms/memeplexPanelModel'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { useStores } from '../stores/StoresContext'

const ARCHIVE_SUB = 'meme_archive'

export interface CapRow { userId: string; sharesLabel: string; label: string }
export type DetailMediaModel =
  | { kind: 'image'; imageProps: { src: string; alt: string } }
  | { kind: 'video'; videoProps: { src: string; controls: true; loop: true; autoPlay: true; muted: true; playsInline: true; poster: string; 'aria-label': string } }
export interface DetailActionModel { label: string; className?: 'danger' | undefined; buttonProps: { onClick: () => void } }
export interface DetailListingModel {
  cardLabel: string
  saleLabel: string
  sharesLabel: string
  priceLabel: string
  showBuy: boolean
  showUnlist: boolean
  buyInputProps: { value: number; min: number; max: number; onChange: ChangeEventHandler<HTMLInputElement> }
  buyButtonLabel: string
  buyButtonProps: { onClick: () => void; disabled: boolean }
  unlistButtonProps: { onClick: () => void; disabled: boolean }
}
export interface DetailListModel {
  show: boolean
  sharesInputProps: { value: number; min: number; max: number; onChange: ChangeEventHandler<HTMLInputElement> }
  priceInputProps: { value: number; min: number; step: number; onChange: ChangeEventHandler<HTMLInputElement> }
  listButtonProps: { onClick: () => void; disabled: boolean }
}
export interface DetailSourceModel { id: string; label: string; viewsLabel: string; linkProps?: { href: string; target: '_blank'; rel: 'noreferrer' } | undefined }
export interface MemeDetailModel {
  id: string
  title: string
  private: boolean
  tierKey: string
  tierColor: string
  tierLabel: string
  tierHype: string
  media: DetailMediaModel
  creatorLinkProps: { to: string }
  creatorName: string
  ownerLinkProps: { to: string }
  ownerName: string
  tagsLabel: string | null
  remixLinkProps?: { to: string } | undefined
  sourceLinkProps?: { href: string; target: '_blank'; rel: 'noreferrer' } | undefined
  sourceLabel?: string | undefined
  viewsLabel: string
  resharesLabel: string
  valueLabel: string
  holdingsLabel: string | null
  shareInputProps: { value: string; readOnly: true }
  copyButtonLabel: string
  copyButtonProps: { onClick: () => void }
  previewLinkProps: { href: string; target: '_blank'; rel: 'noreferrer' }
  actions: readonly DetailActionModel[]
  notice: string | null
  error: string | null
  listing: DetailListingModel | null
  list: DetailListModel
  sources: readonly DetailSourceModel[]
  plex: MemeplexPanelModel
  capTable: readonly CapRow[]
  deleteDialog: ConfirmDialogModel
}
export interface MemeDetailScreenModel { phase: MemeDetailPhase; showNotFound: boolean; showLoading: boolean; detail: MemeDetailModel | null }

function holderLabel(userId: string, meSub: string | null, names: Record<string, string>, cache: Map<string, string>): string {
  if (meSub && userId === meSub) return 'You'
  return names[userId] ?? cache.get(userId) ?? `${userId.slice(0, 10)}…`
}
function numberFromInput(event: React.ChangeEvent<HTMLInputElement>): number { return Number(event.target.value) }

/** Detail loading, auth-aware binder access, user actions, and element props. */
export function useMemeDetailScreen(): MemeDetailScreenModel {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const { auth } = useStores()
  const [snapshot, send, actor] = useProjectedActor(memeDetailMachine, { input: { id: id ?? null } })
  const holderNameCache = useRef(new Map<string, string>())
  const holderNameRequests = useRef(new Set<string>())
  const binderGate = useRef(createDetailBinderGate())
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const context = snapshot.context
  const phase = snapshot.value as MemeDetailPhase

  const resolveHolderNames = useCallback((positions: Position[], meSub: string | null) => {
    for (const position of positions) {
      if ((meSub && position.userId === meSub) || holderNameCache.current.has(position.userId) || holderNameRequests.current.has(position.userId)) continue
      holderNameRequests.current.add(position.userId)
      apiFetch<{ users: { sub: string; name: string }[] }>('/api/users?q=')
        .then((result) => {
          const hit = result.users.find((candidate) => candidate.sub === position.userId)
          if (hit) {
            holderNameCache.current.set(hit.sub, hit.name)
            send({ type: 'SET_HOLDER_NAME', sub: hit.sub, name: hit.name })
          }
        })
        .catch(() => {})
        .finally(() => holderNameRequests.current.delete(position.userId))
    }
  }, [send])

  const load = useCallback(() => {
    const memeId = actor.getSnapshot().context.id
    if (!memeId) { send({ type: 'NOT_FOUND' }); return }
    apiFetch<{ meme: Meme; positions: Position[] }>(`/api/memes/${memeId}`)
      .then((result) => { send({ type: 'LOADED', meme: result.meme, positions: result.positions }); resolveHolderNames(result.positions, auth.user?.sub ?? null) })
      .catch(() => send({ type: 'NOT_FOUND' }))
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
        .catch(() => {})
    }
    const unsubscribeActor = actor.subscribe(loadBinderWhenEligible)
    const disposeAuth = autorun(loadBinderWhenEligible)
    load()
    const memeId = actor.getSnapshot().context.id
    if (memeId) apiFetch<Memeplex>(`/api/memes/${memeId}/memeplex`).then((plex) => send({ type: 'SET_PLEX', plex })).catch(() => {})
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
    catch (error) { send({ type: 'FAIL', err: error instanceof Error ? error.message : 'action failed' }) }
  }, [load, refresh, send])

  const meme = context.meme
  const myShares = context.positions.find((position) => position.userId === user?.sub)?.shares ?? 0
  const isSeller = meme?.listing?.sellerId === user?.sub
  const shareUrl = meme ? `${window.location.origin}/m/${meme.id}` : ''
  const showNotFound = phase === 'empty' || (phase === 'error' && !meme)
  const showLoading = !showNotFound && (phase === 'loading' || !meme)
  if (!meme) return { phase, showNotFound, showLoading, detail: null }

  const buySharesChange: ChangeEventHandler<HTMLInputElement> = (event) => send({ type: 'SET_BUY_SHARES', shares: numberFromInput(event) })
  const sellSharesChange: ChangeEventHandler<HTMLInputElement> = (event) => send({ type: 'SET_SELL_SHARES', shares: numberFromInput(event) })
  const priceChange: ChangeEventHandler<HTMLInputElement> = (event) => send({ type: 'SET_PRICE', price: numberFromInput(event) })
  const onCopy = () => {
    if (!shareUrl) return
    void navigator.clipboard.writeText(shareUrl).then(() => { send({ type: 'SET_COPIED', copied: true }); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => send({ type: 'SET_COPIED', copied: false }), 2000) })
  }
  const onPlexAdd = (memeId: string) => {
    const live = actor.getSnapshot().context
    if (!live.meme) return
    const linked = new Set([live.meme.id, ...(live.plex?.ancestors.map((candidate) => candidate.id) ?? []), ...(live.plex?.remixes.map((candidate) => candidate.id) ?? []), ...(live.plex?.related.map((candidate) => candidate.id) ?? [])])
    if (linked.has(memeId)) { send({ type: 'SET_PLEX_MSG', msg: memeId === live.meme.id ? "That's this meme — already the center of its own memeplex." : 'Already in the memeplex.' }); return }
    send({ type: 'SET_PLEX_MSG', msg: null })
    void post(`/api/memes/${live.meme.id}/memeplex`, { memeId }).then(() => {
      send({ type: 'SET_PLEX_MSG', msg: 'Added to the memeplex 🕸️' }); send({ type: 'SET_PLEX_PICK', pick: '' }); send({ type: 'SET_PLEX_PASTED', pasted: '' })
      return apiFetch<Memeplex>(`/api/memes/${live.meme!.id}/memeplex`).then((plex) => send({ type: 'SET_PLEX', plex }))
    }).catch((error) => send({ type: 'SET_PLEX_MSG', msg: error instanceof Error ? error.message : 'failed to add' }))
  }
  const listing = meme.listing && meme.listing.shares > 0 ? {
    cardLabel: `${meme.listing.shares} sh @ 🧠${meme.listing.pricePerShare}`,
    saleLabel: `On sale: ${meme.listing.shares} shares @ 🧠${meme.listing.pricePerShare}/share`,
    sharesLabel: `${meme.listing.shares} shares`, priceLabel: `🧠${meme.listing.pricePerShare}/share`, showBuy: !!user && !isSeller, showUnlist: !!isSeller,
    buyInputProps: { value: context.buyShares, min: 1, max: meme.listing.shares, onChange: buySharesChange },
    buyButtonLabel: `Buy for 🧠${Math.ceil(context.buyShares * meme.listing.pricePerShare)}`,
    buyButtonProps: { onClick: () => void act(() => post(`/api/memes/${meme.id}/buy`, { shares: actor.getSnapshot().context.buyShares }), 'Shares acquired 💼', 'buy'), disabled: phase === 'buying' },
    unlistButtonProps: { onClick: () => void act(() => post(`/api/memes/${meme.id}/unlist`, {}), 'Delisted'), disabled: phase === 'listing' },
  } : null
  const actions: DetailActionModel[] = []
  if (user) actions.push({ label: '🧬 Create a meme from this', buttonProps: { onClick: () => navigate(`/binder/new?remix=${meme.id}`) } })
  if (user && meme.creatorId === ARCHIVE_SUB) actions.push({ label: '📼 This is my meme — claim it', buttonProps: { onClick: () => { const note = window.prompt('Tell us why this meme is yours (links help your case):'); if (note !== null) void act(() => post(`/api/memes/${meme.id}/claim`, { note }), 'Claim filed 📼 — we’ll review it and transfer the card if it checks out.') } } })
  if (myShares === 100) actions.push({ label: meme.private ? '🌐 Make public' : '🙈 Make private', buttonProps: { onClick: () => void act(() => post(`/api/memes/${meme.id}/visibility`, { private: !meme.private }), meme.private ? 'Back on the marketplace 🌐' : 'Hidden from the marketplace 🙈 (still in your binder)') } })
  if (myShares === 100 && meme.private) actions.push({ label: '🗑️ Delete forever', className: 'danger', buttonProps: { onClick: () => send({ type: 'SET_CONFIRMING_DELETE', confirming: true }) } })

  return {
    phase, showNotFound, showLoading,
    detail: {
      id: meme.id, title: meme.title, private: !!meme.private, tierKey: meme.tier.key, tierColor: meme.tier.color, tierLabel: `${meme.tier.name} · ${meme.tier.rarity}`, tierHype: meme.tier.hype,
      media: meme.mediaType === 'video' && meme.videoUrl ? { kind: 'video', videoProps: { src: meme.videoUrl, controls: true, loop: true, autoPlay: true, muted: true, playsInline: true, poster: meme.imageUrl, 'aria-label': meme.title } } : { kind: 'image', imageProps: { src: meme.imageUrl, alt: meme.title } },
      creatorLinkProps: { to: `/u/${encodeURIComponent(meme.creatorId)}` }, creatorName: meme.creatorName, ownerLinkProps: { to: `/u/${encodeURIComponent(meme.ownerId)}` }, ownerName: meme.ownerName,
      tagsLabel: meme.tags.length ? meme.tags.map((tag) => `#${tag}`).join(' ') : null, remixLinkProps: meme.remixOf ? { to: `/m/${meme.remixOf}` } : undefined,
      sourceLinkProps: meme.source ? { href: meme.source.url, target: '_blank', rel: 'noreferrer' } : undefined, sourceLabel: meme.source ? `via ${meme.source.provider.toUpperCase()}${meme.source.author ? ` (@${meme.source.author})` : ''}` : undefined,
      viewsLabel: (meme.views ?? meme.reshares).toLocaleString(), resharesLabel: (meme.reshareCount ?? 0).toLocaleString(), valueLabel: meme.value.toLocaleString(), holdingsLabel: myShares > 0 ? `${myShares}/100` : null,
      shareInputProps: { value: shareUrl, readOnly: true }, copyButtonLabel: context.copied ? 'Copied ✓' : 'Copy link', copyButtonProps: { onClick: onCopy }, previewLinkProps: { href: `/api/memes/${meme.id}/og.png`, target: '_blank', rel: 'noreferrer' }, actions, notice: context.msg, error: context.err,
      listing,
      list: { show: !listing && myShares > 0, sharesInputProps: { value: context.sellShares, min: 1, max: myShares, onChange: sellSharesChange }, priceInputProps: { value: context.price, min: 0.01, step: 0.01, onChange: priceChange }, listButtonProps: { onClick: () => void act(() => post(`/api/memes/${meme.id}/list`, { shares: actor.getSnapshot().context.sellShares, pricePerShare: actor.getSnapshot().context.price }), 'Listed on the marketplace 🏷️', 'list'), disabled: phase === 'listing' } },
      sources: (context.stats?.sources ?? []).map((source) => ({ id: source.source, label: source.source, viewsLabel: source.views.toLocaleString(), linkProps: source.url ? { href: source.url, target: '_blank', rel: 'noreferrer' } : undefined })),
      plex: buildMemeplexPanelModel({ meme, plex: context.plex, canEdit: !!user && (meme.creatorId === user.sub || myShares > 0), binder: context.plexBinder, pick: context.plexPick, pasted: context.plexPasted, notice: context.plexMsg, onPickChange: (pick) => send({ type: 'SET_PLEX_PICK', pick }), onPastedChange: (pasted) => send({ type: 'SET_PLEX_PASTED', pasted }), onAdd: onPlexAdd }),
      capTable: context.positions.map((position) => ({ userId: position.userId, sharesLabel: `${position.shares}/100`, label: holderLabel(position.userId, user?.sub ?? null, context.holderNames, holderNameCache.current) })),
      deleteDialog: buildConfirmDialogModel({ open: context.confirmingDelete, danger: true, busy: context.deleting || phase === 'deleting', title: 'Delete this meme forever?', message: createElement(Fragment, null, createElement('strong', null, `"${meme.title}"`), ' will be permanently removed — its card, share link, view history, and memeplex links all go with it. This cannot be undone.'), confirmLabel: 'Delete it forever', onCancel: () => send({ type: 'SET_CONFIRMING_DELETE', confirming: false }), onConfirm: () => { const live = actor.getSnapshot().context.meme; if (!live) return; send({ type: 'DELETE' }); void apiFetch(`/api/memes/${live.id}`, { method: 'DELETE' }).then(() => { send({ type: 'DONE' }); navigate('/binder') }).catch((error) => send({ type: 'FAIL', err: error instanceof Error ? error.message : 'delete failed' })) } }),
    },
  }
}
