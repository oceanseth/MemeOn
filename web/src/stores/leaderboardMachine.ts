import { assign, setup } from 'xstate'
import type { LeaderRow } from '../lib/types'

export type LeaderboardPhase = 'loading' | 'ready' | 'empty' | 'error'

export interface LeaderboardContext {
  leaders: LeaderRow[]
  err: string | null
}

export type LeaderboardEvent =
  | { type: 'DONE'; leaders: LeaderRow[] }
  | { type: 'FAIL'; err: string }
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
    /* retry is a transition, not React state: the spinner comes back with the error cleared */
    RETRY: {
      target: '.loading',
      actions: assign({ err: null }),
    },
  },
  states: {
    loading: {},
    ready: {},
    empty: {},
    error: {},
  },
})
