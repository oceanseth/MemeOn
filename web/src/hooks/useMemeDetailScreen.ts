import { useProjectedActor } from './useProjectedActor'
import { autorun } from 'mobx'
import { createElement, Fragment, useCallback, useRef, type ChangeEventHandler, type HTMLAttributes } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TIERS } from '@memeon/shared/tiers'
import { apiFetch, post } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
import { braincells } from '../lib/braincells'
import { buildConfirmDialogModel, type ConfirmDialogModel } from '../lib/confirmDialogModel'
import { createDetailBinderGate } from '../lib/detailBinderGate'
import { buildMemeCardModel, type MemeCardModel } from '../lib/memeCardModel'
import { plural, pluralWord } from '../lib/plural'
import type { Meme, Memeplex, Position } from '../lib/types'
import { clampPrice, clampShares, memeDetailMachine, type MemeDetailPhase, type MemeStats } from '../stores/memeDetailMachine'
import { buildMemeplexPanelModel, type MemeplexPanelModel } from '../lib/memeplexPanelModel'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { useStores } from '../stores/StoresContext'

const ARCHIVE_SUB = 'meme_archive'
/** braincell spend that earns a restatement before it leaves the wallet */
const CONFIRM_SPEND_OVER = 25

export interface CapRow { userId: string; sharesLabel: string; label: string }
export interface DetailActionModel { label: string; variant?: 'danger' | undefined; buttonProps: { onClick: () => void } }
export type DetailLiveRegionProps = Pick<HTMLAttributes<HTMLDivElement>, 'role' | 'aria-live'>
export interface DetailNotFoundModel {
  message: string
  linkProps: { to: string }
  linkLabel: string
}
export interface DetailSignedOutModel {
  title: string
  body: string
  loginLabel: string
  loginButtonProps: { onClick: () => void; disabled: boolean; 'aria-busy': boolean; 'aria-label': string }
  browseLinkProps: { to: string }
  browseLabel: string
  error: string | null
  errorProps: Pick<HTMLAttributes<HTMLParagraphElement>, 'role'>
}
export interface DetailTierLadderModel {
  /** the meter's left label — the tier this card is wearing right now */
  currentLabel: string
  nextLabel: string
  fillStyle: { width: string }
  meterProps: {
    role: 'progressbar'
    'aria-label': string
    'aria-valuemin': number
    'aria-valuemax': number
    'aria-valuenow': number
    'aria-valuetext': string
  }
}
export interface DetailListingModel {
  saleLabel: string
  sharesLabel: string
  priceLabel: string
  showBuy: boolean
  showUnlist: boolean
  buyLabel: string
  /** the card's caption: what the viewer can spend, and the invitation to pick an amount */
  balanceLabel: string | null
  disabledReason: string | null
  buyInputProps: { value: number; min: number; max: number; step: 1; onChange: ChangeEventHandler<HTMLInputElement> }
  buyButtonLabel: string
  buyButtonProps: { onClick: () => void; disabled: boolean; 'aria-busy': boolean }
  unlistButtonLabel: string
  unlistButtonProps: { onClick: () => void; disabled: boolean; 'aria-busy': boolean }
}
export interface DetailListModel {
  show: boolean
  disabledReason: string | null
  sharesInputProps: { value: number; min: number; max: number; step: 1; onChange: ChangeEventHandler<HTMLInputElement> }
  priceInputProps: { value: number; min: number; step: number; onChange: ChangeEventHandler<HTMLInputElement> }
  listButtonLabel: string
  listButtonProps: { onClick: () => void; disabled: boolean; 'aria-busy': boolean }
}
export interface DetailSourceModel { id: string; label: string; viewsLabel: string; linkProps?: { href: string; target: '_blank'; rel: 'noreferrer' } | undefined }
export interface MemeDetailModel {
  id: string
  title: string
  private: boolean
  tierKey: string
  /** the tier's product name on its own — Paper … Shiny */
  tierName: string
  /**
   * The hero card's own callout, directly under the title on every board that draws this page
   * (`296-0` G4P-0 signed in, `KRK-0` KS6-0 on the public card): "Prismatic · 5,800 reshares".
   * One string for both, because the two boards differ only in the colour the screen paints it.
   */
  tierLine: string
  tierLabel: string
  tierHype: string
  tierLadder: DetailTierLadderModel
  /** the hero frame: the same `MemeCardModel` every grid thumb renders, at `size="lg"` */
  card: MemeCardModel
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
  /** the nouns agree with the figures beside them: real cards do have exactly 1 reshare */
  viewsWord: string
  resharesWord: string
  valueLabel: string
  /** spoken names for the compact stat row, whose glyphs are decorative */
  statsSrLabel: string
  valueSrLabel: string
  holdingsLabel: string | null
  shareInputProps: { value: string; readOnly: true; 'aria-label': string }
  copyButtonLabel: string
  copyButtonProps: { onClick: () => void }
  previewLinkProps: { href: string; target: '_blank'; rel: 'noreferrer' }
  signedOut: DetailSignedOutModel | null
  actions: readonly DetailActionModel[]
  notice: string | null
  noticeProps: DetailLiveRegionProps
  error: string | null
  errorProps: DetailLiveRegionProps
  listing: DetailListingModel | null
  list: DetailListModel
  sources: readonly DetailSourceModel[]
  plex: MemeplexPanelModel
  capTableTitle: string
  /** The board's second cap-table line: who is currently selling, and how much (`G68-0`/`KTS-0`). */
  capTableNote: string | null
  capTable: readonly CapRow[]
  deleteDialog: ConfirmDialogModel
  buyDialog: ConfirmDialogModel
  claimDialog: ConfirmDialogModel
}
export interface MemeDetailScreenModel {
  phase: MemeDetailPhase
  showNotFound: boolean
  showLoading: boolean
  notFound: DetailNotFoundModel
  loadingLabel: string
  detail: MemeDetailModel | null
}

function holderLabel(userId: string, meSub: string | null, names: Record<string, string>, cache: Map<string, string>): string {
  if (meSub && userId === meSub) return 'You'
  return names[userId] ?? cache.get(userId) ?? 'another collector'
}
function numberFromInput(event: React.ChangeEvent<HTMLInputElement>): number { return Number(event.target.value) }

/** Where this card sits on the rarity ladder, and what the next rung costs. */
export function buildTierLadderModel(tierKey: string, views: number): DetailTierLadderModel {
  const index = Math.max(0, TIERS.findIndex((tier) => tier.key === tierKey))
  const tier = TIERS[index]
  const next = TIERS[index + 1]
  if (!next) {
    return {
      currentLabel: `${tier.name} is spreading`,
      nextLabel: `Top of the ladder — ${tier.name} is as rare as it gets ✨`,
      fillStyle: { width: '100%' },
      meterProps: {
        role: 'progressbar', 'aria-label': 'Progress to the next tier',
        'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 100,
        'aria-valuetext': `${tier.name} is the top tier`,
      },
    }
  }
  const span = Math.max(1, next.minReshares - tier.minReshares)
  const progress = Math.min(100, Math.max(0, Math.round(((views - tier.minReshares) / span) * 100)))
  const remaining = Math.max(0, next.minReshares - views)
  const nextLabel = `${remaining.toLocaleString()} more views → ${next.name}`
  return {
    currentLabel: `${tier.name} is spreading`,
    nextLabel,
    fillStyle: { width: `${progress}%` },
    meterProps: {
      role: 'progressbar', 'aria-label': 'Progress to the next tier',
      'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': progress,
      'aria-valuetext': nextLabel,
    },
  }
}

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
      .catch(() => { holderNamesRequested.current = false })
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

  const notFound: DetailNotFoundModel = {
    message: "This meme isn't here — it may have been deleted or made private.",
    linkProps: { to: '/marketplace' },
    linkLabel: 'Browse the marketplace',
  }
  const meme = context.meme
  const myShares = context.positions.find((position) => position.userId === user?.sub)?.shares ?? 0
  const isSeller = meme?.listing?.sellerId === user?.sub
  const shareUrl = meme ? `${window.location.origin}/m/${meme.id}` : ''
  const showNotFound = phase === 'empty' || (phase === 'error' && !meme)
  const showLoading = !showNotFound && (phase === 'loading' || !meme)
  const loadingLabel = 'Pulling the card…'
  if (!meme) return { phase, showNotFound, showLoading, notFound, loadingLabel, detail: null }

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
    if (linked.has(memeId)) { send({ type: 'SET_PLEX_ERR', err: memeId === live.meme.id ? "That's this meme — already the center of its own memeplex." : 'Already in the memeplex.' }); return }
    send({ type: 'SET_PLEX_MSG', msg: null })
    void post(`/api/memes/${live.meme.id}/memeplex`, { memeId }).then(() => {
      send({ type: 'SET_PLEX_MSG', msg: 'Added to the memeplex 🕸️' }); send({ type: 'SET_PLEX_PICK', pick: '' }); send({ type: 'SET_PLEX_PASTED', pasted: '' })
      return apiFetch<Memeplex>(`/api/memes/${live.meme!.id}/memeplex`).then((plex) => send({ type: 'SET_PLEX', plex }))
    }).catch((error) => send({ type: 'SET_PLEX_ERR', err: error instanceof Error ? error.message : 'failed to add' }))
  }

  const coins = user?.coins ?? 0
  /* `reshares` is the legacy name of the same share-link counter `views` reports, and it is what
     the tier the API returned was computed from — the fallback is one metric, not a borrowed one. */
  const views = meme.views ?? meme.reshares
  const reshareCount = meme.reshareCount ?? 0
  const pricePerShare = meme.listing?.pricePerShare ?? 0
  const buyShares = context.buyShares
  const buyTotal = Math.ceil(buyShares * pricePerShare)
  const shortBy = Math.max(0, buyTotal - coins)
  const buyReason = buyShares < 1 ? 'Pick at least 1 share.' : shortBy > 0 ? `${braincells(shortBy)} short — sell some shares or open a pack first.` : null
  const runBuy = () => void act(() => post(`/api/memes/${meme.id}/buy`, { shares: clampShares(actor.getSnapshot().context.buyShares, meme.listing?.shares ?? 100) }), 'Shares acquired 💼', 'buy')
  const sellShares = context.sellShares
  const listReason = sellShares < 1
    ? 'Pick at least 1 share.'
    : sellShares > myShares
      ? `You only hold ${myShares} shares.`
      : context.price < 0.01
        ? `Set a price of at least ${braincells('0.01')} per share.`
        : null

  const listing: DetailListingModel | null = meme.listing && meme.listing.shares > 0 ? {
    saleLabel: `${plural(meme.listing.shares, 'share')} up for grabs · ${braincells(meme.listing.pricePerShare)} each`,
    sharesLabel: `${meme.listing.shares} shares`, priceLabel: `${braincells(meme.listing.pricePerShare)}/share`, showBuy: !!user && !isSeller, showUnlist: !!isSeller,
    buyLabel: 'shares to buy',
    balanceLabel: user ? `You’ve got ${braincells(coins)}. Pick how much of the joke you want.` : null,
    disabledReason: buyReason,
    buyInputProps: { value: buyShares, min: 1, max: meme.listing.shares, step: 1, onChange: buySharesChange },
    buyButtonLabel: phase === 'buying' ? 'Buying…' : buyShares < 1 ? 'Buy shares' : `Buy for ${braincells(buyTotal)}`,
    buyButtonProps: {
      onClick: () => { if (buyTotal > CONFIRM_SPEND_OVER) send({ type: 'SET_CONFIRMING_BUY', confirming: true }); else runBuy() },
      disabled: phase === 'buying' || !!buyReason,
      'aria-busy': phase === 'buying',
    },
    unlistButtonLabel: phase === 'listing' ? 'Removing…' : 'Remove listing',
    unlistButtonProps: { onClick: () => void act(() => post(`/api/memes/${meme.id}/unlist`, {}), 'Delisted'), disabled: phase === 'listing', 'aria-busy': phase === 'listing' },
  } : null

  const actions: DetailActionModel[] = []
  if (user) actions.push({ label: '🧬 Create a meme from this', buttonProps: { onClick: () => navigate(`/binder/new?remix=${meme.id}`) } })
  if (user && meme.creatorId === ARCHIVE_SUB) actions.push({ label: '📼 This is my meme — claim it', buttonProps: { onClick: () => send({ type: 'SET_CONFIRMING_CLAIM', confirming: true }) } })
  if (myShares === 100) actions.push({ label: meme.private ? '🌐 Make public' : '🙈 Make private', buttonProps: { onClick: () => void act(() => post(`/api/memes/${meme.id}/visibility`, { private: !meme.private }), meme.private ? 'Back on the marketplace 🌐' : 'Hidden from the marketplace 🙈 (still in your binder)') } })
  if (myShares === 100 && meme.private) actions.push({ label: '🗑️ Delete forever', variant: 'danger', buttonProps: { onClick: () => send({ type: 'SET_CONFIRMING_DELETE', confirming: true }) } })

  /* "12 of CyberSeth's shares are listed" — the sentence the board closes its cap table with
     (`296-0` G68-0, `KRK-0` KTS-0). The seller is a holder like any other, so it speaks through the
     same resolver the rows use. */
  const capTableNote: string | null = meme.listing && meme.listing.shares > 0
    ? `${plural(meme.listing.shares, 'share')} of ${isSeller
        ? 'yours'
        : `${holderLabel(meme.listing.sellerId, user?.sub ?? null, context.holderNames, holderNameCache.current)}’s`
      } ${meme.listing.shares === 1 ? 'is' : 'are'} listed`
    : null

  const signedOut: DetailSignedOutModel | null = user ? null : {
    title: 'Own a piece of this',
    /* the board leads with the offer when there is one, then the invitation (public-share KSN-0) */
    body: meme.listing && meme.listing.shares > 0
      ? `${plural(meme.listing.shares, 'share')} listed at ${braincells(meme.listing.pricePerShare)} each. Log in with Masky to buy, remix, or mint your own.`
      : 'Log in with Masky to buy, remix, or mint your own.',
    loginLabel: context.loggingIn ? 'Redirecting…' : '🎭 Log in with Masky',
    loginButtonProps: {
      onClick: () => { send({ type: 'LOGIN_START' }); void beginMaskyLogin().catch((error) => send({ type: 'LOGIN_FAIL', err: error instanceof Error ? error.message : 'login failed' })) },
      disabled: context.loggingIn,
      'aria-busy': context.loggingIn,
      'aria-label': context.loggingIn ? 'Redirecting to Masky' : 'Log in with Masky',
    },
    browseLinkProps: { to: '/marketplace' },
    browseLabel: 'Browse the marketplace',
    error: context.loginErr,
    errorProps: { role: 'alert' },
  }

  /* the same stable factory every grid thumb builds its card from; the one deviation is `loading`,
     since the hero is always above the fold and the factory's `lazy` default is a grid thumb's
     assumption, not this page's. */
  const heroCard: MemeCardModel = (() => {
    const built = buildMemeCardModel(meme)
    return built.media.kind === 'image'
      ? { ...built, media: { ...built.media, imageProps: { ...built.media.imageProps, loading: 'eager' } } }
      : built
  })()

  return {
    phase, showNotFound, showLoading, notFound, loadingLabel,
    detail: {
      id: meme.id, title: meme.title, private: !!meme.private, tierKey: meme.tier.key, tierName: meme.tier.name,
      tierLine: `${meme.tier.name} · ${reshareCount.toLocaleString()} ${pluralWord(reshareCount, 'reshare')}`,
      tierLabel: `${meme.tier.name} · ${meme.tier.rarity}`, tierHype: meme.tier.hype,
      tierLadder: buildTierLadderModel(meme.tier.key, views),
      card: heroCard,
      creatorLinkProps: { to: `/u/${encodeURIComponent(meme.creatorId)}` }, creatorName: meme.creatorName, ownerLinkProps: { to: `/u/${encodeURIComponent(meme.ownerId)}` }, ownerName: meme.ownerName,
      tagsLabel: meme.tags.length ? meme.tags.map((tag) => `#${tag}`).join(' ') : null, remixLinkProps: meme.remixOf ? { to: `/m/${meme.remixOf}` } : undefined,
      sourceLinkProps: meme.source ? { href: meme.source.url, target: '_blank', rel: 'noreferrer' } : undefined, sourceLabel: meme.source ? `via ${meme.source.provider.toUpperCase()}${meme.source.author ? ` (@${meme.source.author})` : ''}` : undefined,
      viewsLabel: views.toLocaleString(), resharesLabel: reshareCount.toLocaleString(), valueLabel: meme.value.toLocaleString(),
      viewsWord: pluralWord(views, 'view'), resharesWord: pluralWord(reshareCount, 'reshare'),
      statsSrLabel: `${plural(views, 'view')}, ${plural(reshareCount, 'reshare')}`,
      valueSrLabel: `${meme.value.toLocaleString()} braincells card value`,
      holdingsLabel: myShares > 0 ? `${myShares}/100` : null,
      shareInputProps: { value: shareUrl, readOnly: true, 'aria-label': 'Share link for this meme' }, copyButtonLabel: context.copied ? 'Copied ✓' : 'Copy link', copyButtonProps: { onClick: onCopy }, previewLinkProps: { href: `/api/memes/${meme.id}/og.png`, target: '_blank', rel: 'noreferrer' },
      signedOut, actions,
      notice: context.msg, noticeProps: { role: 'status', 'aria-live': 'polite' },
      error: context.err, errorProps: { role: 'alert', 'aria-live': 'assertive' },
      listing,
      list: {
        show: !listing && myShares > 0,
        disabledReason: listReason,
        sharesInputProps: { value: sellShares, min: 1, max: Math.max(1, myShares), step: 1, onChange: sellSharesChange },
        priceInputProps: { value: context.price, min: 0.01, step: 0.01, onChange: priceChange },
        listButtonLabel: phase === 'listing' ? 'Listing…' : 'List',
        listButtonProps: {
          onClick: () => void act(() => post(`/api/memes/${meme.id}/list`, { shares: clampShares(actor.getSnapshot().context.sellShares, Math.max(1, myShares)), pricePerShare: clampPrice(actor.getSnapshot().context.price) }), 'Listed on the marketplace 🏷️', 'list'),
          disabled: phase === 'listing' || !!listReason,
          'aria-busy': phase === 'listing',
        },
      },
      sources: (context.stats?.sources ?? []).map((source) => ({ id: source.source, label: source.source, viewsLabel: source.views.toLocaleString(), linkProps: source.url ? { href: source.url, target: '_blank', rel: 'noreferrer' } : undefined })),
      plex: buildMemeplexPanelModel({ meme, plex: context.plex, canEdit: !!user && (meme.creatorId === user.sub || myShares > 0), binder: context.plexBinder, pick: context.plexPick, pasted: context.plexPasted, notice: context.plexMsg, error: context.plexErr, onPickChange: (pick) => send({ type: 'SET_PLEX_PICK', pick }), onPastedChange: (pasted) => send({ type: 'SET_PLEX_PASTED', pasted }), onAdd: onPlexAdd }),
      capTableTitle: 'Who holds this card · 100 shares',
      capTableNote,
      capTable: context.positions.map((position) => ({ userId: position.userId, sharesLabel: `${position.shares}/100`, label: holderLabel(position.userId, user?.sub ?? null, context.holderNames, holderNameCache.current) })),
      deleteDialog: buildConfirmDialogModel({ open: context.confirmingDelete, id: 'delete-meme', danger: true, busy: context.deleting || phase === 'deleting', title: 'Delete this meme forever?', message: createElement(Fragment, null, createElement('strong', null, `"${meme.title}"`), ' will be permanently removed — its card, share link, view history, and memeplex links all go with it. This cannot be undone.'), confirmLabel: 'Delete it forever', onCancel: () => send({ type: 'SET_CONFIRMING_DELETE', confirming: false }), onConfirm: () => { const live = actor.getSnapshot().context.meme; if (!live) return; send({ type: 'DELETE' }); void apiFetch(`/api/memes/${live.id}`, { method: 'DELETE' }).then(() => { send({ type: 'DONE' }); navigate('/binder') }).catch((error) => send({ type: 'FAIL', err: error instanceof Error ? error.message : 'delete failed' })) } }),
      buyDialog: buildConfirmDialogModel({ open: context.confirmingBuy, id: 'buy-shares', busy: phase === 'buying', title: `Spend ${braincells(buyTotal)}?`, message: createElement(Fragment, null, `${buyShares} ${buyShares === 1 ? 'share' : 'shares'} of `, createElement('strong', null, `"${meme.title}"`), ` at ${braincells(pricePerShare)}/share. You hold ${braincells(coins)}, and purchases are final.`), confirmLabel: `Buy ${buyShares} ${buyShares === 1 ? 'share' : 'shares'}`, onCancel: () => send({ type: 'SET_CONFIRMING_BUY', confirming: false }), onConfirm: runBuy }),
      claimDialog: buildConfirmDialogModel({
        open: context.confirmingClaim, id: 'claim-meme',
        title: 'Claim this meme?',
        message: 'This card is sitting in the archive. Tell us why it belongs to you and we’ll take a look.',
        confirmLabel: 'File the claim',
        prompt: {
          label: 'Why is this meme yours?',
          value: context.claimNote,
          placeholder: 'the original post, your handle, anything that proves it',
          maxLength: 400,
          hint: 'Links help your case.',
          onChange: (note) => send({ type: 'SET_CLAIM_NOTE', note }),
        },
        onCancel: () => send({ type: 'SET_CONFIRMING_CLAIM', confirming: false }),
        onConfirm: () => {
          const note = actor.getSnapshot().context.claimNote
          send({ type: 'SET_CONFIRMING_CLAIM', confirming: false })
          void act(() => post(`/api/memes/${meme.id}/claim`, { note }), 'Claim filed 📼 — we’ll review it and transfer the card if it checks out.')
        },
      }),
    },
  }
}
