import { useProjectedActor } from './useProjectedActor'
import { Fragment, createElement, useCallback, useRef, type ChangeEventHandler, type FormEventHandler, type HTMLAttributes } from 'react'
import { apiFetch, post } from '../lib/api'
import { buildConfirmDialogModel, type ConfirmDialogModel } from '../lib/confirmDialogModel'
import type { FriendEntry, Meme, Trade } from '../lib/types'
import { buildTradeCardModel, tradeSideSentence, type TradeCardModel, type TradeAction, type TradeMemeInfo } from '../lib/tradeCardModel'
import { tradeProposalPayload, tradesMachine, type TradesPhase } from '../stores/tradesMachine'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

export interface TradeComposerModel {
  formProps: { id: string; onSubmit: FormEventHandler<HTMLFormElement> }
  /** friends loaded and none of them accepted: the form has nothing to work with */
  noFriends: boolean
  friendSelectProps: { value: string; onValueChange: (value: string | null) => void }; friends: readonly FriendEntry[]
  offerMemeSelectProps: { value: string; onValueChange: (value: string | null) => void }; binderOptions: readonly { id: string; label: string }[]; showOfferShares: boolean
  offerSharesInputProps: { value: number; min: number; max: number; onChange: ChangeEventHandler<HTMLInputElement> }; offerSharesHint: string
  offerCoinsInputProps: { value: number; min: number; max: number; onChange: ChangeEventHandler<HTMLInputElement> }; offerCoinsHint: string
  askMemeSelectProps: { value: string; onValueChange: (value: string | null) => void }; theirMemeOptions: readonly { id: string; label: string }[]; showAskShares: boolean
  askSharesInputProps: { value: number; min: number; max: number; onChange: ChangeEventHandler<HTMLInputElement> }; askCoinsInputProps: { value: number; min: number; onChange: ChangeEventHandler<HTMLInputElement> }
  error: string | null; errorNoticeProps: HTMLAttributes<HTMLParagraphElement>; proposeButtonProps: { onClick: () => void; disabled: boolean }
}
export interface TradesScreenModel {
  phase: TradesPhase
  newTradeButtonLabel: string
  newTradeButtonProps: { onClick: () => void; 'aria-expanded': boolean; 'aria-controls': string }
  compose: TradeComposerModel | null
  open: readonly TradeCardModel[]
  /** the count beside the "Open proposals" heading; null while there is nothing pending */
  openCountLabel: string | null
  history: readonly TradeCardModel[]
  msg: string | null
  /** Persistent live region, mounted empty: the text swaps, the element never remounts. */
  noticeProps: HTMLAttributes<HTMLDivElement>
  err: string | null
  errorNoticeProps: HTMLAttributes<HTMLElement>
  /** an error that is not the failed load (which owns its own block) */
  showErrorNotice: boolean
  /** the list itself could not be fetched: offer the retry, hide the lists */
  showError: boolean
  retryButtonProps: { onClick: () => void }
  showLoading: boolean
  loadingProps: HTMLAttributes<HTMLDivElement>
  loadingLabel: string
  showLists: boolean
  confirmDialog: ConfirmDialogModel
}
const COMPOSE_FORM_ID = 'trade-composer'
const MAX_COINS = 1_000_000
const LOAD_ERROR = "Couldn't load your trades. Try again."
const RESPOND_ERROR = "Couldn't send your answer — this trade may already have been answered. Try again."
const PROPOSE_ERROR = "Couldn't send that proposal. Check the numbers and try again."
const FRIENDS_ERROR = "Couldn't load your friends list. Close this and open it again."
/** an id that never resolves settles here, so a line stops shimmering and never shows a raw key */
const RETIRED_MEME: TradeMemeInfo = { title: 'a retired meme', imageUrl: '', tierKey: '', tierName: '', tierLabel: '', reshares: 0 }

function collectMemeIds(trades: Trade[]): string[] { const ids = new Set<string>(); for (const trade of trades) { for (const meme of trade.offer.memes) ids.add(meme.memeId); for (const meme of trade.ask.memes) ids.add(meme.memeId) }; return [...ids] }
/**
 * A typed "e" must never reach the payload as NaN and no field may exceed what you hold. The floor
 * stays at 0 so clearing a field mid-edit is not fought; a 0-share side is caught by the guard on
 * the propose button instead.
 */
function clampInt(value: unknown, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return min
  return Math.max(min, Math.min(max, Math.floor(parsed)))
}
const memeInfo = (meme: Meme): TradeMemeInfo => ({
  title: meme.title,
  imageUrl: meme.imageUrl,
  tierKey: meme.tier.key,
  tierName: meme.tier.name,
  tierLabel: `${meme.tier.name} · ${meme.tier.rarity}`,
  reshares: meme.reshareCount ?? meme.reshares,
})
const errorText = (error: unknown, fallback: string): string => (error instanceof Error && error.message ? error.message : fallback)

/** Trade list, compose session lifecycle, and form element props. */
export function useTradesScreen(): TradesScreenModel {
  const { user, refresh } = useAuth()
  const [snapshot, send, actor] = useProjectedActor(tradesMachine)
  const nameCache = useRef(new Map<string, TradeMemeInfo>())
  const nameRequests = useRef(new Set<string>())
  const context = snapshot.context
  const phase = snapshot.value as TradesPhase
  const resolveMemeNames = useCallback((trades: Trade[]) => {
    for (const id of collectMemeIds(trades)) {
      if (nameCache.current.has(id)) {
        send({ type: 'SET_MEME_INFO', id, info: nameCache.current.get(id)! })
        continue
      }
      if (nameRequests.current.has(id)) continue
      nameRequests.current.add(id)
      apiFetch<{ meme: Meme }>(`/api/memes/${id}`)
        .then((result) => {
          const info = memeInfo(result.meme)
          nameCache.current.set(id, info)
          send({ type: 'SET_MEME_INFO', id, info })
        })
        .catch(() => send({ type: 'SET_MEME_INFO', id, info: RETIRED_MEME }))
        .finally(() => nameRequests.current.delete(id))
    }
  }, [send])
  const load = useCallback(() => {
    apiFetch<{ trades: Trade[] }>('/api/trades')
      .then((result) => {
        send({ type: 'LOADED', trades: result.trades })
        resolveMemeNames(result.trades)
      })
      .catch((error) => send({ type: 'FAIL', err: errorText(error, LOAD_ERROR) }))
  }, [resolveMemeNames, send])
  const retry = useCallback(() => {
    send({ type: 'RETRY' })
    load()
  }, [load, send])
  const loadCompose = useCallback((generation: number) => {
    apiFetch<{ friends: FriendEntry[] }>('/api/friends')
      .then((result) => send({ type: 'SET_FRIENDS', friends: result.friends.filter((friend) => friend.status === 'accepted'), composeGeneration: generation }))
      .catch(() => send({ type: 'SET_COMPOSE_ERR', err: FRIENDS_ERROR, composeGeneration: generation }))
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((result) => send({ type: 'SET_BINDER', binder: result.memes.filter((meme) => (meme.myShares ?? 0) > 0), composeGeneration: generation }))
      .catch(() => {})
    apiFetch<{ memes: Meme[] }>('/api/memes')
      .then((result) => send({ type: 'SET_ALL_MEMES', memes: result.memes, composeGeneration: generation }))
      .catch(() => {})
  }, [send])
  useMountEffect(() => { load() })
  const showNew = context.showNew || phase === 'composing'
  const theirMemes = context.allMemes.filter((meme) => meme.ownerId === context.toId || meme.creatorId === context.toId)
  const onToggleNew = () => {
    if (actor.getSnapshot().context.showNew) send({ type: 'CLOSE_COMPOSE' })
    else { send({ type: 'OPEN_COMPOSE' }); loadCompose(actor.getSnapshot().context.composeGeneration) }
  }
  const onToIdChange = (value: string | null) => send({ type: 'SET_TO_ID', toId: value ?? '' })
  const performRespond = (trade: Trade, action: TradeAction) => {
    send({ type: 'RESPOND', tradeId: trade.id, action })
    void post(`/api/trades/${trade.id}/respond`, { action })
      .then(() => { send({ type: 'DONE', msg: action === 'accept' ? 'Trade executed 🤝' : null }); load(); void refresh() })
      .catch((error) => send({ type: 'FAIL', err: errorText(error, RESPOND_ERROR) }))
  }
  // accepting moves shares for good and withdrawing pulls a live offer: both get a confirm step
  const respond = (trade: Trade, action: TradeAction) => {
    if (action === 'decline') performRespond(trade, action)
    else send({ type: 'ASK_CONFIRM', tradeId: trade.id, action })
  }
  const propose = () => {
    const live = actor.getSnapshot().context
    const generation = live.composeGeneration
    send({ type: 'SET_BUSY', busy: true, composeGeneration: generation })
    send({ type: 'SET_COMPOSE_ERR', err: null, composeGeneration: generation })
    void post('/api/trades', tradeProposalPayload(live))
      .then(() => { send({ type: 'CLOSE_COMPOSE', composeGeneration: generation }); load() })
      .catch((error) => {
        send({ type: 'SET_COMPOSE_ERR', err: errorText(error, PROPOSE_ERROR), composeGeneration: generation })
        send({ type: 'SET_BUSY', busy: false, composeGeneration: generation })
      })
  }
  const heldShares = context.binder.find((meme) => meme.id === context.offerMeme)?.myShares ?? 0
  const offerSharesMax = heldShares > 0 ? heldShares : 100
  const availableCoins = Math.max(0, user?.coins ?? 0)
  const noFriends = context.friendsLoaded && context.friends.length === 0
  const emptyProposal = !context.offerMeme && context.offerCoins <= 0 && !context.askMeme && context.askCoins <= 0
  const zeroShares = (!!context.offerMeme && context.offerShares < 1) || (!!context.askMeme && context.askShares < 1)
  const compose: TradeComposerModel | null = showNew ? {
    formProps: { id: COMPOSE_FORM_ID, onSubmit: (event) => { event.preventDefault(); propose() } },
    noFriends,
    friendSelectProps: { value: context.toId, onValueChange: onToIdChange }, friends: context.friends, offerMemeSelectProps: { value: context.offerMeme, onValueChange: (value) => send({ type: 'SET_OFFER_MEME', memeId: value ?? '' }) }, binderOptions: context.binder.map((meme) => ({ id: meme.id, label: `${meme.title} (you hold ${meme.myShares})` })), showOfferShares: !!context.offerMeme, offerSharesInputProps: { value: context.offerShares, min: 1, max: offerSharesMax, onChange: (event) => send({ type: 'SET_OFFER_SHARES', shares: clampInt(event.target.value, 0, offerSharesMax) }) }, offerSharesHint: `you hold ${heldShares}`, offerCoinsInputProps: { value: context.offerCoins, min: 0, max: availableCoins, onChange: (event) => send({ type: 'SET_OFFER_COINS', coins: clampInt(event.target.value, 0, availableCoins) }) }, offerCoinsHint: `🧠 ${availableCoins.toLocaleString()} available`, askMemeSelectProps: { value: context.askMeme, onValueChange: (value) => send({ type: 'SET_ASK_MEME', memeId: value ?? '' }) }, theirMemeOptions: theirMemes.map((meme) => ({ id: meme.id, label: meme.title })), showAskShares: !!context.askMeme, askSharesInputProps: { value: context.askShares, min: 1, max: 100, onChange: (event) => send({ type: 'SET_ASK_SHARES', shares: clampInt(event.target.value, 0, 100) }) }, askCoinsInputProps: { value: context.askCoins, min: 0, onChange: (event) => send({ type: 'SET_ASK_COINS', coins: clampInt(event.target.value, 0, MAX_COINS) }) }, error: context.composeErr, errorNoticeProps: { role: 'alert', 'aria-live': 'assertive' }, proposeButtonProps: { onClick: propose, disabled: !context.toId || context.busy || noFriends || emptyProposal || zeroShares },
  } : null
  const actingId = phase === 'acting' ? context.actingTradeId : null
  const actingAction = phase === 'acting' ? context.actingAction : null
  const open = context.trades.filter((trade) => trade.status === 'proposed').map((trade) => buildTradeCardModel({ trade, meSub: user?.sub ?? '', memeNames: context.memeNames, onRespond: respond, busyTradeId: actingId, busyAction: actingAction }))
  const history = context.trades.filter((trade) => trade.status !== 'proposed').map((trade) => buildTradeCardModel({ trade, meSub: user?.sub ?? '', memeNames: context.memeNames }))
  const confirming = context.confirming
  const confirmingTrade = confirming ? context.trades.find((trade) => trade.id === confirming.tradeId) ?? null : null
  const accepting = confirming?.action === 'accept'
  const confirmDialog = buildConfirmDialogModel({
    id: 'trade-confirm',
    open: !!confirmingTrade,
    danger: !accepting,
    busy: phase === 'acting',
    title: accepting ? 'Accept this trade?' : 'Withdraw this proposal?',
    message: confirmingTrade
      ? accepting
        ? createElement(Fragment, null,
            createElement('strong', null, 'You give '), tradeSideSentence(confirmingTrade.ask, context.memeNames), '. ',
            createElement('strong', null, 'You get '), tradeSideSentence(confirmingTrade.offer, context.memeNames), '.')
        : createElement(Fragment, null,
            `You offered ${tradeSideSentence(confirmingTrade.offer, context.memeNames)} for ${tradeSideSentence(confirmingTrade.ask, context.memeNames)}. Withdrawing takes it off ${confirmingTrade.toName}'s table.`)
      : '',
    confirmLabel: accepting ? 'Accept' : 'Withdraw',
    onCancel: () => send({ type: 'CANCEL_CONFIRM' }),
    onConfirm: () => { if (confirmingTrade && confirming) performRespond(confirmingTrade, confirming.action) },
  })
  const showError = context.loadFailed
  return {
    phase,
    /* the board strips the fullwidth plus: the composer's own submit is the action, this opens it */
    newTradeButtonLabel: showNew ? 'Close' : 'Propose a trade',
    newTradeButtonProps: { onClick: onToggleNew, 'aria-expanded': showNew, 'aria-controls': COMPOSE_FORM_ID },
    compose,
    open,
    /* "waiting" is already the state, not a countable noun — the number is the only plural */
    openCountLabel: open.length > 0 ? `${open.length} waiting` : null,
    history,
    msg: context.msg,
    noticeProps: { role: 'status', 'aria-live': 'polite' },
    err: context.err,
    errorNoticeProps: { role: 'alert', 'aria-live': 'assertive' },
    showErrorNotice: !!context.err && !showError,
    showError,
    retryButtonProps: { onClick: retry },
    showLoading: phase === 'loading',
    loadingProps: { role: 'status', 'aria-live': 'polite' },
    loadingLabel: 'Loading trades…',
    showLists: phase !== 'loading' && !showError,
    confirmDialog,
  }
}
