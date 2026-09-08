import { useMachine } from '@xstate/react'
import { useCallback } from 'react'
import { apiFetch, post } from '../lib/api'
import type { FriendEntry, Meme, Trade, TradeSide } from '../lib/types'
import { tradesMachine, type TradesPhase } from '../stores/tradesMachine'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

const memeNameCache = new Map<string, string>()

export type TradeAction = 'accept' | 'decline' | 'cancel'

export interface TradesScreenModel {
  phase: TradesPhase
  open: Trade[]
  history: Trade[]
  msg: string | null
  composeErr: string | null
  showNew: boolean
  friends: FriendEntry[]
  binder: Meme[]
  theirMemes: Meme[]
  toId: string
  offerMeme: string
  offerShares: number
  offerCoins: number
  askMeme: string
  askShares: number
  askCoins: number
  busy: boolean
  memeNames: Record<string, string>
  meSub: string
  showLoading: boolean
  showLists: boolean
  showOfferShares: boolean
  showAskShares: boolean
  canPropose: boolean
  onToggleNew: () => void
  onRespond: (trade: Trade, action: TradeAction) => void
  onToIdChange: (toId: string) => void
  onOfferMemeChange: (memeId: string) => void
  onOfferSharesChange: (n: number) => void
  onOfferCoinsChange: (n: number) => void
  onAskMemeChange: (memeId: string) => void
  onAskSharesChange: (n: number) => void
  onAskCoinsChange: (n: number) => void
  onPropose: () => void
}

function collectMemeIds(trades: Trade[]): string[] {
  const ids = new Set<string>()
  for (const t of trades) {
    for (const m of t.offer.memes) ids.add(m.memeId)
    for (const m of t.ask.memes) ids.add(m.memeId)
  }
  return [...ids]
}

/** Everything `TradesScreen` renders. The hook is the engine; the screen is the terminal. */
export function useTradesScreen(): TradesScreenModel {
  const { user, refresh } = useAuth()
  const [snapshot, send, actor] = useMachine(tradesMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as TradesPhase

  const resolveMemeNames = useCallback(
    (trades: Trade[]) => {
      for (const id of collectMemeIds(trades)) {
        if (memeNameCache.has(id)) {
          send({ type: 'SET_MEME_NAME', id, title: memeNameCache.get(id)! })
          continue
        }
        apiFetch<{ meme: Meme }>(`/api/memes/${id}`)
          .then((r) => {
            memeNameCache.set(id, r.meme.title)
            send({ type: 'SET_MEME_NAME', id, title: r.meme.title })
          })
          .catch(() => {})
      }
    },
    [send],
  )

  const load = useCallback(() => {
    apiFetch<{ trades: Trade[] }>('/api/trades')
      .then((r) => {
        send({ type: 'LOADED', trades: r.trades })
        resolveMemeNames(r.trades)
      })
      .catch(() => send({ type: 'LOADED', trades: [] }))
  }, [resolveMemeNames, send])

  const loadCompose = useCallback(() => {
    apiFetch<{ friends: FriendEntry[] }>('/api/friends')
      .then((r) => send({ type: 'SET_FRIENDS', friends: r.friends.filter((f) => f.status === 'accepted') }))
      .catch(() => {})
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((r) => send({ type: 'SET_BINDER', binder: r.memes.filter((m) => (m.myShares ?? 0) > 0) }))
      .catch(() => {})
    apiFetch<{ memes: Meme[] }>('/api/memes')
      .then((r) => send({ type: 'SET_ALL_MEMES', memes: r.memes }))
      .catch(() => {})
  }, [send])

  useMountEffect(() => {
    load()
  })

  const theirMemes = ctx.allMemes.filter((m) => m.ownerId === ctx.toId || m.creatorId === ctx.toId)
  const open = ctx.trades.filter((t) => t.status === 'proposed')
  const history = ctx.trades.filter((t) => t.status !== 'proposed')
  const showLoading = phase === 'loading'
  const showLists = !showLoading

  return {
    phase,
    open,
    history,
    msg: ctx.msg,
    composeErr: ctx.composeErr,
    showNew: ctx.showNew || phase === 'composing',
    friends: ctx.friends,
    binder: ctx.binder,
    theirMemes,
    toId: ctx.toId,
    offerMeme: ctx.offerMeme,
    offerShares: ctx.offerShares,
    offerCoins: ctx.offerCoins,
    askMeme: ctx.askMeme,
    askShares: ctx.askShares,
    askCoins: ctx.askCoins,
    busy: ctx.busy,
    memeNames: ctx.memeNames,
    meSub: user?.sub ?? '',
    showLoading,
    showLists,
    showOfferShares: !!ctx.offerMeme,
    showAskShares: !!ctx.askMeme,
    canPropose: !!ctx.toId && !ctx.busy,
    onToggleNew: () => {
      if (actor.getSnapshot().context.showNew) {
        send({ type: 'CLOSE_COMPOSE' })
      } else {
        send({ type: 'OPEN_COMPOSE' })
        loadCompose()
      }
    },
    onRespond: (trade, action) => {
      send({ type: 'RESPOND' })
      void post(`/api/trades/${trade.id}/respond`, { action })
        .then(() => {
          send({ type: 'DONE', msg: action === 'accept' ? 'Trade executed 🤝' : null })
          load()
          void refresh()
        })
        .catch((e) => send({ type: 'FAIL', err: e instanceof Error ? e.message : 'action failed' }))
    },
    onToIdChange: (toId) => send({ type: 'SET_TO_ID', toId }),
    onOfferMemeChange: (memeId) => send({ type: 'SET_OFFER_MEME', memeId }),
    onOfferSharesChange: (n) => send({ type: 'SET_OFFER_SHARES', shares: n }),
    onOfferCoinsChange: (n) => send({ type: 'SET_OFFER_COINS', coins: n }),
    onAskMemeChange: (memeId) => send({ type: 'SET_ASK_MEME', memeId }),
    onAskSharesChange: (n) => send({ type: 'SET_ASK_SHARES', shares: n }),
    onAskCoinsChange: (n) => send({ type: 'SET_ASK_COINS', coins: n }),
    onPropose: () => {
      const live = actor.getSnapshot().context
      send({ type: 'SET_BUSY', busy: true })
      send({ type: 'SET_COMPOSE_ERR', err: null })
      const offer: TradeSide = {
        memes: live.offerMeme ? [{ memeId: live.offerMeme, shares: live.offerShares }] : [],
        coins: live.offerCoins,
      }
      const ask: TradeSide = {
        memes: live.askMeme ? [{ memeId: live.askMeme, shares: live.askShares }] : [],
        coins: live.askCoins,
      }
      void post('/api/trades', { toId: live.toId, offer, ask })
        .then(() => {
          send({ type: 'CLOSE_COMPOSE' })
          load()
        })
        .catch((e) => {
          send({ type: 'SET_COMPOSE_ERR', err: e instanceof Error ? e.message : 'proposal failed' })
          send({ type: 'SET_BUSY', busy: false })
        })
    },
  }
}
