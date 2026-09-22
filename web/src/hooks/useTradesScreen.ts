import { useProjectedActor } from './useProjectedActor'
import {
  useCallback,
  useRef,
  type ChangeEventHandler,
  type FormEventHandler,
  type HTMLAttributes,
} from 'react'
import { tradesCopy } from '../copy/trades'
import { apiFetch, post } from '../lib/api'
import { buildConfirmDialogModel, type ConfirmDialogModel } from '../lib/confirmDialogModel'
import { memeReshareCount } from '../lib/memeMetrics'
import type { FriendEntry, Meme, Trade } from '../lib/types'
import {
  buildTradeCardModel,
  tradeSideSentence,
  type TradeCardModel,
  type TradeAction,
  type TradeMemeInfo,
} from '../lib/tradeCardModel'
import { tradeProposalPayload, tradesMachine, type TradesPhase } from '../stores/tradesMachine'
import type { SelectOption } from '@/atoms/select'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

export interface TradeComposerModel {
  formProps: { id: string; onSubmit: FormEventHandler<HTMLFormElement> }
  /** friends loaded and none of them accepted: the form has nothing to work with */
  noFriends: boolean
  noFriendsMessage: string
  findFriendsLinkProps: { to: string }
  findFriendsLabel: string
  heading: string
  intro: string
  tradeWithLabel: string
  friendSelectProps: {
    value: string
    onValueChange: (value: string | null) => void
  }
  friendSelectItems: readonly SelectOption[]
  youGiveLegend: string
  youGiveBinderLabel: string
  giveMemeSelectProps: {
    value: string
    onValueChange: (value: string | null) => void
  }
  giveMemeSelectItems: readonly SelectOption[]
  showGiveShares: boolean
  sharesToGiveLabel: string
  giveSharesInputProps: {
    value: number
    min: number
    max: number
    onChange: ChangeEventHandler<HTMLInputElement>
  }
  giveSharesHint: string
  braincellsAddLabel: string
  giveCoinsInputProps: {
    value: number
    min: number
    max: number
    onChange: ChangeEventHandler<HTMLInputElement>
  }
  giveCoinsHint: string
  youGetLegend: string
  youGetMemesLabel: string
  getMemeSelectProps: {
    value: string
    onValueChange: (value: string | null) => void
  }
  getMemeSelectItems: readonly SelectOption[]
  showGetShares: boolean
  sharesToGetLabel: string
  getSharesInputProps: {
    value: number
    min: number
    max: number
    onChange: ChangeEventHandler<HTMLInputElement>
  }
  braincellsGetLabel: string
  getCoinsInputProps: {
    value: number
    min: number
    onChange: ChangeEventHandler<HTMLInputElement>
  }
  proposeCaption: string
  error: string | null
  errorNoticeProps: HTMLAttributes<HTMLParagraphElement>
  proposeButtonLabel: string
  proposeButtonProps: { onClick: () => void; disabled: boolean }
}
export interface TradesScreenModel {
  phase: TradesPhase
  pageTitle: string
  newTradeButtonLabel: string
  newTradeButtonProps: {
    onClick: () => void
    'aria-expanded': boolean
    'aria-controls': string
  }
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
  errorTitle: string
  errorMessage: string
  retryButtonProps: { onClick: () => void }
  retryLabel: string
  showLoading: boolean
  loadingProps: HTMLAttributes<HTMLDivElement>
  loadingLabel: string
  showLists: boolean
  openHeading: string
  openEmptyMessage: string
  historyHeading: string
  historyEmptyMessage: string
  confirmDialog: ConfirmDialogModel
}
const COMPOSE_FORM_ID = 'trade-composer'
const MAX_COINS = 1_000_000
const copy = tradesCopy
/** an id that never resolves settles here, so a line stops shimmering and never shows a raw key */
const RETIRED_MEME: TradeMemeInfo = {
  title: copy.retiredMemeTitle,
  imageUrl: '',
  tierKey: '',
  tierName: '',
  tierLabel: '',
  reshares: 0,
}

function collectMemeIds(trades: Trade[]): string[] {
  const ids = new Set<string>()
  for (const trade of trades) {
    for (const meme of trade.offer.memes) ids.add(meme.memeId)
    for (const meme of trade.ask.memes) ids.add(meme.memeId)
  }
  return [...ids]
}
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
  tierLabel: copy.memeTierLabel(meme.tier.name, meme.tier.rarity),
  reshares: memeReshareCount(meme),
})
const errorText = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback

/** Trade list, compose session lifecycle, and form element props. */
export function useTradesScreen(): TradesScreenModel {
  const { user, refresh } = useAuth()
  const [snapshot, send, actor] = useProjectedActor(tradesMachine)
  const nameCache = useRef(new Map<string, TradeMemeInfo>())
  const nameRequests = useRef(new Set<string>())
  const context = snapshot.context
  const phase = snapshot.value as TradesPhase
  const resolveMemeNames = useCallback(
    (trades: Trade[]) => {
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
    },
    [send],
  )
  const load = useCallback(() => {
    apiFetch<{ trades: Trade[] }>('/api/trades')
      .then((result) => {
        send({ type: 'LOADED', trades: result.trades })
        resolveMemeNames(result.trades)
      })
      .catch((error) => send({ type: 'FAIL', err: errorText(error, copy.loadError.title) }))
  }, [resolveMemeNames, send])
  const retry = useCallback(() => {
    send({ type: 'RETRY' })
    load()
  }, [load, send])
  const loadCompose = useCallback(
    (generation: number) => {
      apiFetch<{ friends: FriendEntry[] }>('/api/friends')
        .then((result) =>
          send({
            type: 'SET_FRIENDS',
            friends: result.friends.filter((friend) => friend.status === 'accepted'),
            composeGeneration: generation,
          }),
        )
        .catch(() =>
          send({
            type: 'SET_COMPOSE_ERR',
            err: copy.errors.friends,
            composeGeneration: generation,
          }),
        )
      apiFetch<{ memes: Meme[] }>('/api/binder')
        .then((result) =>
          send({
            type: 'SET_BINDER',
            binder: result.memes.filter((meme) => (meme.myShares ?? 0) > 0),
            composeGeneration: generation,
          }),
        )
        .catch(() => {
          if (actor.getSnapshot().context.composeErr) return
          send({
            type: 'SET_COMPOSE_ERR',
            err: copy.errors.composeLoad,
            composeGeneration: generation,
          })
        })
      apiFetch<{ memes: Meme[] }>('/api/memes')
        .then((result) =>
          send({
            type: 'SET_ALL_MEMES',
            memes: result.memes,
            composeGeneration: generation,
          }),
        )
        .catch(() => {
          if (actor.getSnapshot().context.composeErr) return
          send({
            type: 'SET_COMPOSE_ERR',
            err: copy.errors.composeLoad,
            composeGeneration: generation,
          })
        })
    },
    [actor, send],
  )
  useMountEffect(() => {
    load()
  })
  const showNew = context.showNew || phase === 'composing'
  const theirMemes = context.allMemes.filter(
    (meme) => meme.ownerId === context.toId || meme.creatorId === context.toId,
  )
  const onToggleNew = () => {
    if (actor.getSnapshot().context.showNew) send({ type: 'CLOSE_COMPOSE' })
    else {
      send({ type: 'OPEN_COMPOSE' })
      loadCompose(actor.getSnapshot().context.composeGeneration)
    }
  }
  const onToIdChange = (value: string | null) => send({ type: 'SET_TO_ID', toId: value ?? '' })
  const performRespond = (trade: Trade, action: TradeAction) => {
    send({ type: 'RESPOND', tradeId: trade.id, action })
    void post(`/api/trades/${trade.id}/respond`, { action })
      .then(() => {
        send({
          type: 'DONE',
          msg: action === 'accept' ? copy.toasts.executed : null,
        })
        load()
        void refresh()
      })
      .catch((error) => send({ type: 'FAIL', err: errorText(error, copy.errors.respond) }))
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
      .then(() => {
        send({ type: 'CLOSE_COMPOSE', composeGeneration: generation })
        load()
      })
      .catch((error) => {
        send({
          type: 'SET_COMPOSE_ERR',
          err: errorText(error, copy.errors.propose),
          composeGeneration: generation,
        })
        send({ type: 'SET_BUSY', busy: false, composeGeneration: generation })
      })
  }
  const heldShares = context.binder.find((meme) => meme.id === context.offerMeme)?.myShares ?? 0
  const offerSharesMax = heldShares > 0 ? heldShares : 100
  const availableCoins = Math.max(0, user?.coins ?? 0)
  const noFriends = context.friendsLoaded && context.friends.length === 0
  const emptyProposal =
    !context.offerMeme && context.offerCoins <= 0 && !context.askMeme && context.askCoins <= 0
  const zeroShares =
    (!!context.offerMeme && context.offerShares < 1) || (!!context.askMeme && context.askShares < 1)
  const binderOptions = context.binder.map((meme) => ({
    value: meme.id,
    label: copy.composer.binderOption(meme.title, meme.myShares ?? 0),
  }))
  const theirMemeOptions = theirMemes.map((meme) => ({
    value: meme.id,
    label: meme.title,
  }))
  const noMemeOption = { value: '', label: copy.noMeme }
  const compose: TradeComposerModel | null = showNew
    ? {
        formProps: {
          id: COMPOSE_FORM_ID,
          onSubmit: (event) => {
            event.preventDefault()
            propose()
          },
        },
        noFriends,
        noFriendsMessage: copy.composer.noFriends,
        findFriendsLinkProps: { to: '/friends' },
        findFriendsLabel: copy.composer.findFriends,
        heading: copy.composer.heading,
        intro: copy.composer.intro,
        tradeWithLabel: copy.composer.tradeWith,
        friendSelectProps: { value: context.toId, onValueChange: onToIdChange },
        friendSelectItems: [
          { value: '', label: copy.composer.pickFriend },
          ...context.friends.map((friend) => ({
            value: friend.sub,
            label: friend.name,
          })),
        ],
        youGiveLegend: copy.composer.youGiveLegend,
        youGiveBinderLabel: copy.composer.youGiveBinder,
        giveMemeSelectProps: {
          value: context.offerMeme,
          onValueChange: (value) => send({ type: 'SET_OFFER_MEME', memeId: value ?? '' }),
        },
        giveMemeSelectItems: [noMemeOption, ...binderOptions],
        showGiveShares: !!context.offerMeme,
        sharesToGiveLabel: copy.composer.sharesToGive,
        giveSharesInputProps: {
          value: context.offerShares,
          min: 1,
          max: offerSharesMax,
          onChange: (event) =>
            send({
              type: 'SET_OFFER_SHARES',
              shares: clampInt(event.target.value, 0, offerSharesMax),
            }),
        },
        giveSharesHint: copy.composer.giveSharesHint(heldShares),
        braincellsAddLabel: copy.composer.braincellsAdd,
        giveCoinsInputProps: {
          value: context.offerCoins,
          min: 0,
          max: availableCoins,
          onChange: (event) =>
            send({
              type: 'SET_OFFER_COINS',
              coins: clampInt(event.target.value, 0, availableCoins),
            }),
        },
        giveCoinsHint: copy.composer.giveCoinsHint(availableCoins),
        youGetLegend: copy.composer.youGetLegend,
        youGetMemesLabel: copy.composer.youGetMemes,
        getMemeSelectProps: {
          value: context.askMeme,
          onValueChange: (value) => send({ type: 'SET_ASK_MEME', memeId: value ?? '' }),
        },
        getMemeSelectItems: [noMemeOption, ...theirMemeOptions],
        showGetShares: !!context.askMeme,
        sharesToGetLabel: copy.composer.sharesToGet,
        getSharesInputProps: {
          value: context.askShares,
          min: 1,
          max: 100,
          onChange: (event) =>
            send({
              type: 'SET_ASK_SHARES',
              shares: clampInt(event.target.value, 0, 100),
            }),
        },
        braincellsGetLabel: copy.composer.braincellsGet,
        getCoinsInputProps: {
          value: context.askCoins,
          min: 0,
          onChange: (event) =>
            send({
              type: 'SET_ASK_COINS',
              coins: clampInt(event.target.value, 0, MAX_COINS),
            }),
        },
        proposeCaption: copy.composer.proposeCaption,
        error: context.composeErr,
        errorNoticeProps: { role: 'alert', 'aria-live': 'assertive' },
        proposeButtonLabel: copy.newTrade,
        proposeButtonProps: {
          onClick: propose,
          disabled: !context.toId || context.busy || noFriends || emptyProposal || zeroShares,
        },
      }
    : null
  const actingId = phase === 'acting' ? context.actingTradeId : null
  const actingAction = phase === 'acting' ? context.actingAction : null
  const open = context.trades
    .filter((trade) => trade.status === 'proposed')
    .map((trade) =>
      buildTradeCardModel({
        trade,
        meSub: user?.sub ?? '',
        memeNames: context.memeNames,
        onRespond: respond,
        busyTradeId: actingId,
        busyAction: actingAction,
      }),
    )
  const history = context.trades
    .filter((trade) => trade.status !== 'proposed')
    .map((trade) =>
      buildTradeCardModel({
        trade,
        meSub: user?.sub ?? '',
        memeNames: context.memeNames,
      }),
    )
  const confirming = context.confirming
  const confirmingTrade = confirming
    ? (context.trades.find((trade) => trade.id === confirming.tradeId) ?? null)
    : null
  const accepting = confirming?.action === 'accept'
  const confirmingMine = !!confirmingTrade && confirmingTrade.fromId === (user?.sub ?? '')
  const giveSide = confirmingTrade
    ? confirmingMine
      ? confirmingTrade.offer
      : confirmingTrade.ask
    : null
  const getSide = confirmingTrade
    ? confirmingMine
      ? confirmingTrade.ask
      : confirmingTrade.offer
    : null
  const confirmDialog = buildConfirmDialogModel({
    id: 'trade-confirm',
    open: !!confirmingTrade,
    danger: !accepting,
    busy: phase === 'acting',
    title: accepting ? copy.confirm.acceptTitle : copy.confirm.withdrawTitle,
    message:
      confirmingTrade && giveSide && getSide
        ? accepting
          ? [
              { kind: 'strong' as const, text: copy.confirm.give },
              tradeSideSentence(giveSide, context.memeNames),
              copy.confirm.betweenSides,
              { kind: 'strong' as const, text: copy.confirm.get },
              tradeSideSentence(getSide, context.memeNames),
              copy.confirm.end,
            ]
          : copy.confirm.withdraw(
              tradeSideSentence(giveSide, context.memeNames),
              tradeSideSentence(getSide, context.memeNames),
              confirmingTrade.toName,
            )
        : '',
    confirmLabel: accepting ? copy.confirm.acceptLabel : copy.confirm.withdrawLabel,
    onCancel: () => send({ type: 'CANCEL_CONFIRM' }),
    onConfirm: () => {
      if (confirmingTrade && confirming) performRespond(confirmingTrade, confirming.action)
    },
  })
  const showError = context.loadFailed
  return {
    phase,
    pageTitle: copy.pageTitle,
    /* Opens the compose form; submit lives on the form itself. */
    newTradeButtonLabel: showNew ? copy.closeComposer : copy.newTrade,
    newTradeButtonProps: {
      onClick: onToggleNew,
      'aria-expanded': showNew,
      'aria-controls': COMPOSE_FORM_ID,
    },
    compose,
    open,
    /* "waiting" is already the state, not a countable noun — the number is the only plural */
    openCountLabel: open.length > 0 ? copy.openCount(open.length) : null,
    history,
    msg: context.msg,
    noticeProps: { role: 'status', 'aria-live': 'polite' },
    err: context.err,
    errorNoticeProps: { role: 'alert', 'aria-live': 'assertive' },
    showErrorNotice: !!context.err && !showError,
    showError,
    errorTitle: copy.loadError.title,
    errorMessage: copy.loadError.body,
    retryButtonProps: { onClick: retry },
    retryLabel: copy.retry,
    showLoading: phase === 'loading',
    loadingProps: { role: 'status', 'aria-live': 'polite' },
    loadingLabel: copy.loading,
    showLists: phase !== 'loading' && !showError,
    openHeading: copy.lists.openHeading,
    openEmptyMessage: copy.lists.openEmpty,
    historyHeading: copy.lists.historyHeading,
    historyEmptyMessage: copy.lists.historyEmpty,
    confirmDialog,
  }
}
