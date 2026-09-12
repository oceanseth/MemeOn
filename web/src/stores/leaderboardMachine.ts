import { assign, setup } from 'xstate'
import type { LeaderRow } from '../lib/types'

export type LeaderboardPhase = 'loading' | 'ready' | 'empty' | 'error'

/** The board draws the podium plus five ranked rows before its "Show more brains" (`CMC-0`). */
export const LEADERBOARD_PAGE_SIZE = 8

export interface LeaderboardContext {
  leaders: LeaderRow[]
  err: string | null
  /** how many ranks are on screen; "Show more brains" adds another page */
  visibleLimit: number
}

export type LeaderboardEvent =
  | { type: 'DONE'; leaders: LeaderRow[] }
  | { type: 'FAIL'; err: string }
  | { type: 'SHOW_MORE' }
  | { type: 'RETRY' }

/**
 * Top Brains source of truth. loading → ready|empty|error, error → loading on RETRY.
 * The hook drives fetch; do not add React state here.
 */
export const leaderboardMachine = setup({
  types: {
    context: {} as LeaderboardContext,
    events: {} as LeaderboardEvent,
  },
}).createMachine({
  id: 'leaderboard',
  context: {
    leaders: [],
    err: null,
    visibleLimit: LEADERBOARD_PAGE_SIZE,
  },
  initial: 'loading',
  on: {
    DONE: [
      {
        guard: ({ event }) => event.leaders.length === 0,
        target: '.empty',
        actions: assign({ leaders: ({ event }) => event.leaders, err: null }),
      },
      {
        target: '.ready',
        actions: assign({ leaders: ({ event }) => event.leaders, err: null }),
      },
    ],
    FAIL: {
      target: '.error',
      actions: assign({ err: ({ event }) => event.err }),
    },
    SHOW_MORE: {
      actions: assign({ visibleLimit: ({ context }) => context.visibleLimit + LEADERBOARD_PAGE_SIZE }),
    },
    /* retry is a transition, not React state: the spinner comes back with the error cleared */
    RETRY: {
      target: '.loading',
      actions: assign({ err: null, visibleLimit: LEADERBOARD_PAGE_SIZE }),
    },
  },
  states: {
    loading: {},
    ready: {},
    empty: {},
    error: {},
  },
})
