import { useProjectedActor } from './useProjectedActor'
import { useCallback, useRef, type ChangeEventHandler } from 'react'
import { apiFetch, post } from '../lib/api'
import type { FriendEntry, Meme, Trade } from '../lib/types'
import { buildTradeCardModel, type TradeCardModel, type TradeAction } from '../molecules/tradeCardModel'
import { tradeProposalPayload, tradesMachine, type TradesPhase } from '../stores/tradesMachine'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

export interface TradeComposerModel {
  friendSelectProps: { value: string; onChange: ChangeEventHandler<HTMLSelectElement> }; friends: readonly FriendEntry[]
  offerMemeSelectProps: { value: string; onChange: ChangeEventHandler<HTMLSelectElement> }; binderOptions: readonly { id: string; label: string }[]; showOfferShares: boolean
  offerSharesInputProps: { value: number; min: number; max: number; onChange: ChangeEventHandler<HTMLInputElement> }; offerCoinsInputProps: { value: number; min: number; onChange: ChangeEventHandler<HTMLInputElement> }
  askMemeSelectProps: { value: string; onChange: ChangeEventHandler<HTMLSelectElement> }; theirMemeOptions: readonly { id: string; label: string }[]; showAskShares: boolean
  askSharesInputProps: { value: number; min: number; max: number; onChange: ChangeEventHandler<HTMLInputElement> }; askCoinsInputProps: { value: number; min: number; onChange: ChangeEventHandler<HTMLInputElement> }
  error: string | null; proposeButtonProps: { onClick: () => void; disabled: boolean }
}
export interface TradesScreenModel { phase: TradesPhase; newTradeButtonLabel: string; newTradeButtonProps: { onClick: () => void }; compose: TradeComposerModel | null; open: readonly TradeCardModel[]; history: readonly TradeCardModel[]; msg: string | null; showLoading: boolean; showLists: boolean }
function collectMemeIds(trades: Trade[]): string[] { const ids = new Set<string>(); for (const trade of trades) { for (const meme of trade.offer.memes) ids.add(meme.memeId); for (const meme of trade.ask.memes) ids.add(meme.memeId) }; return [...ids] }
function numberFromInput(event: React.ChangeEvent<HTMLInputElement>): number { return Number(event.target.value) }

/** Trade list, compose session lifecycle, and form element props. */
export function useTradesScreen(): TradesScreenModel {
  const { user, refresh } = useAuth()
  const [snapshot, send, actor] = useProjectedActor(tradesMachine)
  const nameCache = useRef(new Map<string, string>())
  const nameRequests = useRef(new Set<string>())
  const context = snapshot.context
  const phase = snapshot.value as TradesPhase
  const resolveMemeNames = useCallback((trades: Trade[]) => {
    for (const id of collectMemeIds(trades)) {
      if (nameCache.current.has(id)) {
        send({ type: 'SET_MEME_NAME', id, title: nameCache.current.get(id)! })
        continue
      }
      if (nameRequests.current.has(id)) continue
      nameRequests.current.add(id)
      apiFetch<{ meme: Meme }>(`/api/memes/${id}`)
        .then((result) => {
          nameCache.current.set(id, result.meme.title)
          send({ type: 'SET_MEME_NAME', id, title: result.meme.title })
        })
        .catch(() => {})
        .finally(() => nameRequests.current.delete(id))
    }
  }, [send])
  const load = useCallback(() => {
    apiFetch<{ trades: Trade[] }>('/api/trades')
      .then((result) => {
        send({ type: 'LOADED', trades: result.trades })
        resolveMemeNames(result.trades)
      })
      .catch(() => send({ type: 'LOADED', trades: [] }))
  }, [resolveMemeNames, send])
  const loadCompose = useCallback((generation: number) => {
    apiFetch<{ friends: FriendEntry[] }>('/api/friends')
      .then((result) => send({ type: 'SET_FRIENDS', friends: result.friends.filter((friend) => friend.status === 'accepted'), composeGeneration: generation }))
      .catch(() => {})
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
  const onToIdChange: ChangeEventHandler<HTMLSelectElement> = (event) => send({ type: 'SET_TO_ID', toId: event.target.value })
  const respond = (trade: Trade, action: TradeAction) => {
    send({ type: 'RESPOND' })
    void post(`/api/trades/${trade.id}/respond`, { action })
      .then(() => { send({ type: 'DONE', msg: action === 'accept' ? 'Trade executed 🤝' : null }); load(); void refresh() })
      .catch((error) => send({ type: 'FAIL', err: error instanceof Error ? error.message : 'action failed' }))
  }
  const propose = () => {
    const live = actor.getSnapshot().context
    const generation = live.composeGeneration
    send({ type: 'SET_BUSY', busy: true, composeGeneration: generation })
    send({ type: 'SET_COMPOSE_ERR', err: null, composeGeneration: generation })
    void post('/api/trades', tradeProposalPayload(live))
      .then(() => { send({ type: 'CLOSE_COMPOSE', composeGeneration: generation }); load() })
      .catch((error) => {
        send({ type: 'SET_COMPOSE_ERR', err: error instanceof Error ? error.message : 'proposal failed', composeGeneration: generation })
        send({ type: 'SET_BUSY', busy: false, composeGeneration: generation })
      })
  }
  const compose: TradeComposerModel | null = showNew ? {
    friendSelectProps: { value: context.toId, onChange: onToIdChange }, friends: context.friends, offerMemeSelectProps: { value: context.offerMeme, onChange: (event) => send({ type: 'SET_OFFER_MEME', memeId: event.target.value }) }, binderOptions: context.binder.map((meme) => ({ id: meme.id, label: `${meme.title} (you hold ${meme.myShares})` })), showOfferShares: !!context.offerMeme, offerSharesInputProps: { value: context.offerShares, min: 1, max: 100, onChange: (event) => send({ type: 'SET_OFFER_SHARES', shares: numberFromInput(event) }) }, offerCoinsInputProps: { value: context.offerCoins, min: 0, onChange: (event) => send({ type: 'SET_OFFER_COINS', coins: numberFromInput(event) }) }, askMemeSelectProps: { value: context.askMeme, onChange: (event) => send({ type: 'SET_ASK_MEME', memeId: event.target.value }) }, theirMemeOptions: theirMemes.map((meme) => ({ id: meme.id, label: meme.title })), showAskShares: !!context.askMeme, askSharesInputProps: { value: context.askShares, min: 1, max: 100, onChange: (event) => send({ type: 'SET_ASK_SHARES', shares: numberFromInput(event) }) }, askCoinsInputProps: { value: context.askCoins, min: 0, onChange: (event) => send({ type: 'SET_ASK_COINS', coins: numberFromInput(event) }) }, error: context.composeErr, proposeButtonProps: { onClick: propose, disabled: !context.toId || context.busy },
  } : null
  const open = context.trades.filter((trade) => trade.status === 'proposed').map((trade) => buildTradeCardModel({ trade, meSub: user?.sub ?? '', memeNames: context.memeNames, onRespond: respond }))
  const history = context.trades.filter((trade) => trade.status !== 'proposed').map((trade) => buildTradeCardModel({ trade, meSub: user?.sub ?? '', memeNames: context.memeNames }))
  return { phase, newTradeButtonLabel: showNew ? 'Close' : '＋ Propose a trade', newTradeButtonProps: { onClick: onToggleNew }, compose, open, history, msg: context.msg, showLoading: phase === 'loading', showLists: phase !== 'loading' }
}
