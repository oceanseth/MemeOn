import { assign } from 'xstate'
import type { LeaderRow } from '../lib/types'
import { createListPhaseMachine } from './listPhaseMachine'

export type LeaderboardPhase = 'loading' | 'ready' | 'empty' | 'error'

/** Ranks on screen before "Show more brains": podium plus five rows. */
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
export const leaderboardMachine = createListPhaseMachine<LeaderboardContext, LeaderboardEvent>({
  id: 'leaderboard',
  context: {
    leaders: [],
    err: null,
    visibleLimit: LEADERBOARD_PAGE_SIZE,
  },
  isEmpty: ({ event }) => event.leaders.length === 0,
  applyDone: assign({
    leaders: ({ event }: { event: Extract<LeaderboardEvent, { type: 'DONE' }> }) => event.leaders,
  }),
  extraOn: {
    SHOW_MORE: {
      actions: assign({
        visibleLimit: ({ context }: { context: LeaderboardContext }) =>
          context.visibleLimit + LEADERBOARD_PAGE_SIZE,
      }),
    },
  },
  /* retry is a transition, not React state: spinner returns, error clears, page resets to 8 */
  onRetry: assign({ err: null, visibleLimit: LEADERBOARD_PAGE_SIZE }),
})
