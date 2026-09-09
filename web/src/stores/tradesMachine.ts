import { assign, setup } from 'xstate'
import type { FriendEntry, Meme, Trade, TradeSide } from '../lib/types'

export type TradesPhase = 'loading' | 'ready' | 'empty' | 'error' | 'composing' | 'acting'

export interface TradesContext {
  trades: Trade[]
  msg: string | null
  composeErr: string | null
  showNew: boolean
  composeGeneration: number
  friends: FriendEntry[]
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
  memeNames: Record<string, string>
}

export type TradesEvent =
  | { type: 'LOADED'; trades: Trade[] }
  | { type: 'FAIL'; err: string }
  | { type: 'DONE'; msg?: string | null }
  | { type: 'SET_MSG'; msg: string | null }
  | { type: 'SET_COMPOSE_ERR'; err: string | null; composeGeneration?: number }
  | { type: 'OPEN_COMPOSE' }
  | { type: 'CLOSE_COMPOSE'; composeGeneration?: number }
  | { type: 'RESPOND' }
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
  | { type: 'SET_MEME_NAME'; id: string; title: string }

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
    composeErr: null,
    showNew: false,
    composeGeneration: 0,
    friends: [],
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
      actions: assign({ friends: ({ event }) => event.friends }),
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
    SET_OFFER_MEME: { actions: assign({ offerMeme: ({ event }) => event.memeId }) },
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
    SET_MEME_NAME: {
      actions: assign({
        memeNames: ({ context, event }) => ({ ...context.memeNames, [event.id]: event.title }),
      }),
    },
    LOADED: [
      {
        guard: ({ context }) => context.showNew,
        target: '.composing',
        actions: assign({ trades: ({ event }) => event.trades }),
      },
      {
        guard: ({ event }) => event.trades.length === 0,
        target: '.empty',
        actions: assign({ trades: ({ event }) => event.trades }),
      },
      {
        target: '.ready',
        actions: assign({ trades: ({ event }) => event.trades }),
      },
    ],
    OPEN_COMPOSE: {
      target: '.composing',
      actions: assign({
        showNew: true,
        composeGeneration: ({ context }) => context.composeGeneration + 1,
        composeErr: null,
        friends: [],
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
          actions: assign({ msg: ({ event }) => event.err }),
        },
      },
    },
    empty: {
      on: {
        RESPOND: 'acting',
        FAIL: {
          target: 'error',
          actions: assign({ msg: ({ event }) => event.err }),
        },
      },
    },
    ready: {
      on: {
        RESPOND: {
          target: 'acting',
          actions: assign({ msg: null }),
        },
        FAIL: {
          target: 'error',
          actions: assign({ msg: ({ event }) => event.err }),
        },
      },
    },
    composing: {
      on: {
        RESPOND: {
          target: 'acting',
          actions: assign({ msg: null }),
        },
        FAIL: {
          target: 'error',
          actions: assign({ msg: ({ event }) => event.err }),
        },
      },
    },
    acting: {
      on: {
        DONE: restoreAfterAct.map((branch) => ({
          ...branch,
          actions: assign({ msg: ({ event }) => event.msg ?? null }),
        })),
        FAIL: {
          target: 'error',
          actions: assign({ msg: ({ event }) => event.err }),
        },
      },
    },
    error: {
      on: {
        RESPOND: {
          target: 'acting',
          actions: assign({ msg: null }),
        },
        DONE: restoreAfterAct.map((branch) => ({
          ...branch,
          actions: assign({ msg: ({ event }) => event.msg ?? null }),
        })),
        FAIL: {
          actions: assign({ msg: ({ event }) => event.err }),
        },
      },
    },
  },
})
