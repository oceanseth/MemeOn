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

/**
 * Money-adjacent inputs are bounded where the state lives, not by advisory markup attributes.
 * Zero stays reachable so an emptied field is not fought mid-keystroke; the screen disables the
 * action and names the reason instead.
 */
export const MIN_PRICE = 0.01
export const MAX_PRICE = 999_999

export function clampShares(raw: number, max: number): number {
  if (!Number.isFinite(raw)) return 0
  return Math.min(Math.max(Math.floor(raw), 0), Math.max(0, Math.floor(max)))
}

export function clampPrice(raw: number): number {
  if (!Number.isFinite(raw)) return 0
  return Math.min(Math.max(Math.round(raw * 100) / 100, 0), MAX_PRICE)
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
  plexErr: string | null
  claimNote: string
  confirmingClaim: boolean
  confirmingBuy: boolean
  loggingIn: boolean
  loginErr: string | null
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
  | { type: 'SET_PLEX_ERR'; err: string | null }
  | { type: 'SET_CLAIM_NOTE'; note: string }
  | { type: 'SET_CONFIRMING_CLAIM'; confirming: boolean }
  | { type: 'SET_CONFIRMING_BUY'; confirming: boolean }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_FAIL'; err: string }
  | { type: 'SET_PRICE'; price: number }
  | { type: 'SET_SELL_SHARES'; shares: number }
  | { type: 'SET_BUY_SHARES'; shares: number }
  | { type: 'SET_COPIED'; copied: boolean }
  | { type: 'SET_CONFIRMING_DELETE'; confirming: boolean }
  | { type: 'SET_HOLDER_NAMES'; names: Record<string, string> }
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
    plexErr: null,
    claimNote: '',
    confirmingClaim: false,
    confirmingBuy: false,
    loggingIn: false,
    loginErr: null,
    holderNames: {},
  }),
  initial: 'loading',
  on: {
    SET_STATS: { actions: assign({ stats: ({ event }) => event.stats }) },
    SET_PLEX: { actions: assign({ plex: ({ event }) => event.plex }) },
    SET_PLEX_BINDER: { actions: assign({ plexBinder: ({ event }) => event.binder }) },
    SET_PLEX_PICK: { actions: assign({ plexPick: ({ event }) => event.pick }) },
    SET_PLEX_PASTED: { actions: assign({ plexPasted: ({ event }) => event.pasted }) },
    SET_PLEX_MSG: { actions: assign({ plexMsg: ({ event }) => event.msg, plexErr: null }) },
    SET_PLEX_ERR: { actions: assign({ plexErr: ({ event }) => event.err, plexMsg: null }) },
    SET_CLAIM_NOTE: { actions: assign({ claimNote: ({ event }) => event.note }) },
    SET_CONFIRMING_CLAIM: { actions: assign({ confirmingClaim: ({ event }) => event.confirming }) },
    SET_CONFIRMING_BUY: { actions: assign({ confirmingBuy: ({ event }) => event.confirming }) },
    LOGIN_START: { actions: assign({ loggingIn: true, loginErr: null }) },
    LOGIN_FAIL: { actions: assign({ loggingIn: false, loginErr: ({ event }) => event.err }) },
    SET_PRICE: { actions: assign({ price: ({ event }) => clampPrice(event.price) }) },
    SET_SELL_SHARES: { actions: assign({ sellShares: ({ event }) => clampShares(event.shares, 100) }) },
    SET_BUY_SHARES: {
      actions: assign({
        buyShares: ({ context, event }) => clampShares(event.shares, context.meme?.listing?.shares ?? 100),
      }),
    },
    SET_COPIED: { actions: assign({ copied: ({ event }) => event.copied }) },
    SET_CONFIRMING_DELETE: { actions: assign({ confirmingDelete: ({ event }) => event.confirming }) },
    SET_HOLDER_NAMES: {
      actions: assign({
        holderNames: ({ context, event }) => ({ ...context.holderNames, ...event.names }),
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
          actions: assign({ msg: null, err: null, confirmingBuy: false }),
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
        LOADED: {
          actions: assign({
            meme: ({ event }) => event.meme,
            positions: ({ event }) => event.positions,
            err: null,
          }),
        },
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
        LOADED: {
          actions: assign({
            meme: ({ event }) => event.meme,
            positions: ({ event }) => event.positions,
            err: null,
          }),
        },
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
        LOADED: {
          actions: assign({
            meme: ({ event }) => event.meme,
            positions: ({ event }) => event.positions,
            err: null,
          }),
        },
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
          actions: assign({ msg: null, err: null, confirmingBuy: false }),
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
