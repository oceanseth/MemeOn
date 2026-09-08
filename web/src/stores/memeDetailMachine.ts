import { assign, setup } from 'xstate'
import type { Meme, Memeplex, Position } from '../lib/types'

export type MemeDetailPhase =
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error'
  | 'listing'
  | 'buying'
  | 'deleting'

export interface MemeStats {
  views: number
  reshares: number
  sources: { source: string; url: string | null; views: number; firstSeen: string | null }[]
}

export interface MemeDetailInput {
  id: string | null
}

export interface MemeDetailContext {
  id: string | null
  meme: Meme | null
  stats: MemeStats | null
  positions: Position[]
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
  holderNames: Record<string, string>
}

export type MemeDetailEvent =
  | { type: 'LOADED'; meme: Meme; positions: Position[] }
  | { type: 'NOT_FOUND' }
  | { type: 'FAIL'; err: string }
  | { type: 'DONE'; msg?: string | null }
  | { type: 'SET_STATS'; stats: MemeStats }
  | { type: 'SET_PLEX'; plex: Memeplex }
  | { type: 'SET_PLEX_BINDER'; binder: Meme[] }
  | { type: 'SET_PLEX_PICK'; pick: string }
  | { type: 'SET_PLEX_PASTED'; pasted: string }
  | { type: 'SET_PLEX_MSG'; msg: string | null }
  | { type: 'SET_PRICE'; price: number }
  | { type: 'SET_SELL_SHARES'; shares: number }
  | { type: 'SET_BUY_SHARES'; shares: number }
  | { type: 'SET_COPIED'; copied: boolean }
  | { type: 'SET_CONFIRMING_DELETE'; confirming: boolean }
  | { type: 'SET_HOLDER_NAME'; sub: string; name: string }
  | { type: 'SET_MSG'; msg: string | null }
  | { type: 'LIST' }
  | { type: 'BUY' }
  | { type: 'DELETE' }

const backToReady = [
  { guard: ({ context }: { context: MemeDetailContext }) => !!context.meme, target: 'ready' as const },
  { target: 'empty' as const },
]

/**
 * Meme detail source of truth. loading → ready|empty|error,
 * with listing|buying|deleting overlays. The hook drives async work.
 */
export const memeDetailMachine = setup({
  types: {
    context: {} as MemeDetailContext,
    events: {} as MemeDetailEvent,
    input: {} as MemeDetailInput,
  },
}).createMachine({
  id: 'memeDetail',
  context: ({ input }) => ({
    id: input.id,
    meme: null,
    stats: null,
    positions: [],
    msg: null,
    err: null,
    copied: false,
    confirmingDelete: false,
    deleting: false,
    price: 1,
    sellShares: 10,
    buyShares: 1,
    plex: null,
    plexBinder: [],
    plexPick: '',
    plexPasted: '',
    plexMsg: null,
    holderNames: {},
  }),
  initial: 'loading',
  on: {
    SET_STATS: { actions: assign({ stats: ({ event }) => event.stats }) },
    SET_PLEX: { actions: assign({ plex: ({ event }) => event.plex }) },
    SET_PLEX_BINDER: { actions: assign({ plexBinder: ({ event }) => event.binder }) },
    SET_PLEX_PICK: { actions: assign({ plexPick: ({ event }) => event.pick }) },
    SET_PLEX_PASTED: { actions: assign({ plexPasted: ({ event }) => event.pasted }) },
    SET_PLEX_MSG: { actions: assign({ plexMsg: ({ event }) => event.msg }) },
    SET_PRICE: { actions: assign({ price: ({ event }) => event.price }) },
    SET_SELL_SHARES: { actions: assign({ sellShares: ({ event }) => event.shares }) },
    SET_BUY_SHARES: { actions: assign({ buyShares: ({ event }) => event.shares }) },
    SET_COPIED: { actions: assign({ copied: ({ event }) => event.copied }) },
    SET_CONFIRMING_DELETE: { actions: assign({ confirmingDelete: ({ event }) => event.confirming }) },
    SET_HOLDER_NAME: {
      actions: assign({
        holderNames: ({ context, event }) => ({ ...context.holderNames, [event.sub]: event.name }),
      }),
    },
    SET_MSG: { actions: assign({ msg: ({ event }) => event.msg, err: null }) },
    LOADED: {
      target: '.ready',
      actions: assign({
        meme: ({ event }) => event.meme,
        positions: ({ event }) => event.positions,
        err: null,
      }),
    },
    NOT_FOUND: { target: '.empty' },
  },
  states: {
    loading: {
      on: {
        FAIL: {
          target: 'error',
          actions: assign({ err: ({ event }) => event.err }),
        },
      },
    },
    empty: {},
    ready: {
      on: {
        LIST: {
          target: 'listing',
          actions: assign({ msg: null, err: null }),
        },
        BUY: {
          target: 'buying',
          actions: assign({ msg: null, err: null }),
        },
        DELETE: {
          target: 'deleting',
          actions: assign({ deleting: true, err: null }),
        },
        FAIL: {
          target: 'error',
          actions: assign({ err: ({ event }) => event.err, msg: null }),
        },
      },
    },
    listing: {
      on: {
        DONE: {
          target: 'ready',
          actions: assign({ msg: ({ event }) => event.msg ?? null, err: null }),
        },
        FAIL: {
          target: 'error',
          actions: assign({ err: ({ event }) => event.err, msg: null }),
        },
      },
    },
    buying: {
      on: {
        DONE: {
          target: 'ready',
          actions: assign({ msg: ({ event }) => event.msg ?? null, err: null }),
        },
        FAIL: {
          target: 'error',
          actions: assign({ err: ({ event }) => event.err, msg: null }),
        },
      },
    },
    deleting: {
      on: {
        DONE: {
          target: 'ready',
          actions: assign({ deleting: false, confirmingDelete: false }),
        },
        FAIL: {
          target: 'error',
          actions: assign({
            err: ({ event }) => event.err,
            deleting: false,
            confirmingDelete: false,
            msg: null,
          }),
        },
      },
    },
    error: {
      on: {
        LIST: {
          target: 'listing',
          actions: assign({ msg: null, err: null }),
        },
        BUY: {
          target: 'buying',
          actions: assign({ msg: null, err: null }),
        },
        DELETE: {
          target: 'deleting',
          actions: assign({ deleting: true, err: null }),
        },
        DONE: backToReady.map((branch) => ({
          ...branch,
          actions: assign({ msg: ({ event }) => event.msg ?? null, err: null }),
        })),
        FAIL: {
          actions: assign({ err: ({ event }) => event.err, msg: null }),
        },
      },
    },
  },
})
