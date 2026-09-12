import { assign, setup } from 'xstate'
import type { TradeAction, TradeMemeInfo } from '../lib/tradeCardModel'
import type { FriendEntry, Meme, Trade, TradeSide } from '../lib/types'

export type TradesPhase = 'loading' | 'ready' | 'empty' | 'error' | 'composing' | 'acting'

export interface TradesContext {
  trades: Trade[]
  /** successes only — failures live in `err` so the two never share a style */
  msg: string | null
  err: string | null
  /** true only when the list itself could not be fetched */
  loadFailed: boolean
  composeErr: string | null
  showNew: boolean
  composeGeneration: number
  friends: FriendEntry[]
  friendsLoaded: boolean
  binder: Meme[]
  allMemes: Meme[]
  toId: string
  offerMeme: string
  offerShares: number
  offerCoins: number
  askMeme: string
  askShares: number
  askCoins: number
  busy: boolean
  memeNames: Record<string, TradeMemeInfo>
  /** the accept / withdraw awaiting confirmation */
  confirming: { tradeId: string; action: TradeAction } | null
  /** the trade whose respond call is in flight, and which of its actions */
  actingTradeId: string | null
  actingAction: TradeAction | null
}

export type TradesEvent =
  | { type: 'LOADED'; trades: Trade[] }
  | { type: 'FAIL'; err: string }
  | { type: 'DONE'; msg?: string | null }
  | { type: 'SET_MSG'; msg: string | null }
  | { type: 'SET_COMPOSE_ERR'; err: string | null; composeGeneration?: number }
  | { type: 'OPEN_COMPOSE' }
  | { type: 'CLOSE_COMPOSE'; composeGeneration?: number }
  | { type: 'RESPOND'; tradeId: string; action: TradeAction }
  | { type: 'SET_FRIENDS'; friends: FriendEntry[]; composeGeneration: number }
  | { type: 'SET_BINDER'; binder: Meme[]; composeGeneration: number }
  | { type: 'SET_ALL_MEMES'; memes: Meme[]; composeGeneration: number }
  | { type: 'SET_TO_ID'; toId: string }
  | { type: 'SET_OFFER_MEME'; memeId: string }
  | { type: 'SET_OFFER_SHARES'; shares: number }
  | { type: 'SET_OFFER_COINS'; coins: number }
  | { type: 'SET_ASK_MEME'; memeId: string }
  | { type: 'SET_ASK_SHARES'; shares: number }
  | { type: 'SET_ASK_COINS'; coins: number }
  | { type: 'SET_BUSY'; busy: boolean; composeGeneration?: number }
  | { type: 'SET_MEME_INFO'; id: string; info: TradeMemeInfo }
  | { type: 'ASK_CONFIRM'; tradeId: string; action: TradeAction }
  | { type: 'CANCEL_CONFIRM' }
  | { type: 'RETRY' }

export function tradeProposalPayload(context: Pick<
  TradesContext,
  'toId' | 'offerMeme' | 'offerShares' | 'offerCoins' | 'askMeme' | 'askShares' | 'askCoins'
>): { toId: string; offer: TradeSide; ask: TradeSide } {
  return {
    toId: context.toId,
    offer: {
      memes: context.offerMeme ? [{ memeId: context.offerMeme, shares: context.offerShares }] : [],
      coins: context.offerCoins,
    },
    ask: {
      memes: context.askMeme ? [{ memeId: context.askMeme, shares: context.askShares }] : [],
      coins: context.askCoins,
    },
  }
}

const settleAct = { err: null, loadFailed: false, confirming: null, actingTradeId: null, actingAction: null } as const

const restoreAfterAct = [
  { guard: ({ context }: { context: TradesContext }) => context.showNew, target: 'composing' as const },
  { guard: ({ context }: { context: TradesContext }) => context.trades.length === 0, target: 'empty' as const },
  { target: 'ready' as const },
]

/**
 * Trades source of truth. loading → ready|empty|error,
 * with composing|acting overlays. The hook drives async work.
 */
export const tradesMachine = setup({
  types: {
    context: {} as TradesContext,
    events: {} as TradesEvent,
  },
}).createMachine({
  id: 'trades',
  context: {
    trades: [],
    msg: null,
    err: null,
    loadFailed: false,
    composeErr: null,
    showNew: false,
    composeGeneration: 0,
    friends: [],
    friendsLoaded: false,
    binder: [],
    allMemes: [],
    toId: '',
    offerMeme: '',
    offerShares: 10,
    offerCoins: 0,
    askMeme: '',
    askShares: 10,
    askCoins: 0,
    busy: false,
    memeNames: {},
    confirming: null,
    actingTradeId: null,
    actingAction: null,
  },
  initial: 'loading',
  on: {
    SET_MSG: { actions: assign({ msg: ({ event }) => event.msg }) },
    SET_COMPOSE_ERR: {
      guard: ({ context, event }) =>
        event.composeGeneration === undefined ||
        (context.showNew && event.composeGeneration === context.composeGeneration),
      actions: assign({ composeErr: ({ event }) => event.err }),
    },
    SET_FRIENDS: {
      guard: ({ context, event }) => context.showNew && event.composeGeneration === context.composeGeneration,
      actions: assign({ friends: ({ event }) => event.friends, friendsLoaded: true }),
    },
    SET_BINDER: {
      guard: ({ context, event }) => context.showNew && event.composeGeneration === context.composeGeneration,
      actions: assign({ binder: ({ event }) => event.binder }),
    },
    SET_ALL_MEMES: {
      guard: ({ context, event }) => context.showNew && event.composeGeneration === context.composeGeneration,
      actions: assign({ allMemes: ({ event }) => event.memes }),
    },
    SET_TO_ID: { actions: assign({ toId: ({ event }) => event.toId }) },
    SET_OFFER_MEME: {
      actions: assign({
        offerMeme: ({ event }) => event.memeId,
        // a fresh pick can leave the share field above the holding it is now bound to
        offerShares: ({ context, event }) => {
          const held = context.binder.find((meme) => meme.id === event.memeId)?.myShares ?? 0
          return held > 0 ? Math.min(context.offerShares, held) : context.offerShares
        },
      }),
    },
    SET_OFFER_SHARES: { actions: assign({ offerShares: ({ event }) => event.shares }) },
    SET_OFFER_COINS: { actions: assign({ offerCoins: ({ event }) => event.coins }) },
    SET_ASK_MEME: { actions: assign({ askMeme: ({ event }) => event.memeId }) },
    SET_ASK_SHARES: { actions: assign({ askShares: ({ event }) => event.shares }) },
    SET_ASK_COINS: { actions: assign({ askCoins: ({ event }) => event.coins }) },
    SET_BUSY: {
      guard: ({ context, event }) =>
        event.composeGeneration === undefined ||
        (context.showNew && event.composeGeneration === context.composeGeneration),
      actions: assign({ busy: ({ event }) => event.busy }),
    },
    SET_MEME_INFO: {
      actions: assign({
        memeNames: ({ context, event }) => ({ ...context.memeNames, [event.id]: event.info }),
      }),
    },
    ASK_CONFIRM: {
      actions: assign({
        confirming: ({ event }) => ({ tradeId: event.tradeId, action: event.action }),
      }),
    },
    CANCEL_CONFIRM: { actions: assign({ confirming: null }) },
    LOADED: [
      {
        guard: ({ context }) => context.showNew,
        target: '.composing',
        actions: assign({ trades: ({ event }) => event.trades, err: null, loadFailed: false }),
      },
      {
        guard: ({ event }) => event.trades.length === 0,
        target: '.empty',
        actions: assign({ trades: ({ event }) => event.trades, err: null, loadFailed: false }),
      },
      {
        target: '.ready',
        actions: assign({ trades: ({ event }) => event.trades, err: null, loadFailed: false }),
      },
    ],
    OPEN_COMPOSE: {
      target: '.composing',
      actions: assign({
        showNew: true,
        composeGeneration: ({ context }) => context.composeGeneration + 1,
        composeErr: null,
        friends: [],
        friendsLoaded: false,
        binder: [],
        allMemes: [],
        busy: false,
        toId: '',
        offerMeme: '',
        offerShares: 10,
        offerCoins: 0,
        askMeme: '',
        askShares: 10,
        askCoins: 0,
      }),
    },
    CLOSE_COMPOSE: [
      {
        guard: ({ context, event }) =>
          (event.composeGeneration === undefined ||
            (context.showNew && event.composeGeneration === context.composeGeneration)) &&
          context.trades.length === 0,
        target: '.empty',
        actions: assign({ showNew: false, composeErr: null, busy: false }),
      },
      {
        guard: ({ context, event }) =>
          event.composeGeneration === undefined ||
          (context.showNew && event.composeGeneration === context.composeGeneration),
        target: '.ready',
        actions: assign({ showNew: false, composeErr: null, busy: false }),
      },
    ],
  },
  states: {
    loading: {
      on: {
        FAIL: {
          target: 'error',
          actions: assign({ msg: null, err: ({ event }) => event.err, loadFailed: true }),
        },
      },
    },
    empty: {
      on: {
        RESPOND: { target: 'acting', actions: assign({ msg: null, err: null, confirming: null, actingTradeId: ({ event }) => event.tradeId, actingAction: ({ event }) => event.action }) },
        FAIL: {
          target: 'error',
          actions: assign({ msg: null, err: ({ event }) => event.err, loadFailed: false, confirming: null, actingTradeId: null, actingAction: null }),
        },
      },
    },
    ready: {
      on: {
        RESPOND: {
          target: 'acting',
          actions: assign({ msg: null, err: null, confirming: null, actingTradeId: ({ event }) => event.tradeId, actingAction: ({ event }) => event.action }),
        },
        FAIL: {
          target: 'error',
          actions: assign({ msg: null, err: ({ event }) => event.err, loadFailed: false, confirming: null, actingTradeId: null, actingAction: null }),
        },
      },
    },
    composing: {
      on: {
        RESPOND: {
          target: 'acting',
          actions: assign({ msg: null, err: null, confirming: null, actingTradeId: ({ event }) => event.tradeId, actingAction: ({ event }) => event.action }),
        },
        FAIL: {
          target: 'error',
          actions: assign({ msg: null, err: ({ event }) => event.err, loadFailed: false, confirming: null, actingTradeId: null, actingAction: null }),
        },
      },
    },
    acting: {
      on: {
        DONE: restoreAfterAct.map((branch) => ({
          ...branch,
          actions: assign({ msg: ({ event }) => event.msg ?? null, ...settleAct }),
        })),
        FAIL: {
          target: 'error',
          actions: assign({ msg: null, err: ({ event }) => event.err, loadFailed: false, confirming: null, actingTradeId: null, actingAction: null }),
        },
      },
    },
    error: {
      on: {
        RESPOND: {
          target: 'acting',
          actions: assign({ msg: null, err: null, loadFailed: false, confirming: null, actingTradeId: ({ event }) => event.tradeId, actingAction: ({ event }) => event.action }),
        },
        DONE: restoreAfterAct.map((branch) => ({
          ...branch,
          actions: assign({ msg: ({ event }) => event.msg ?? null, ...settleAct }),
        })),
        FAIL: {
          actions: assign({ msg: null, err: ({ event }) => event.err, confirming: null, actingTradeId: null, actingAction: null }),
        },
        RETRY: {
          target: 'loading',
          actions: assign({ err: null, loadFailed: false }),
        },
      },
    },
  },
})
