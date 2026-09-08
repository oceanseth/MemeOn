import { assign, setup } from 'xstate'
import type { Meme } from '../lib/types'
import type { SortDir, SortKey } from '../molecules/SortChips'

export type MarketplacePhase = 'loading' | 'ready' | 'empty' | 'error'

export interface MarketplaceContext {
  memes: Meme[]
  nextCursor: string | null
  q: string
  type: string
  tier: string
  listed: boolean
  sortKey: SortKey
  sortDir: SortDir
  err: string | null
}

export type MarketplaceEvent =
  | { type: 'SET_Q'; q: string }
  | { type: 'SET_TYPE'; value: string }
  | { type: 'SET_TIER'; value: string }
  | { type: 'SET_LISTED'; listed: boolean }
  | { type: 'SET_SORT'; sortKey: SortKey; sortDir: SortDir }
  | { type: 'LOADED'; memes: Meme[]; nextCursor: string | null }
  | { type: 'APPEND'; memes: Meme[]; nextCursor: string | null }
  | { type: 'CURSOR'; nextCursor: string | null }
  | { type: 'FAIL'; err: string }

/**
 * Marketplace list source of truth. loading → ready|empty|error.
 * The hook drives fetch, debounce, and infinite scroll; do not add React state here.
 */
export const marketplaceMachine = setup({
  types: {
    context: {} as MarketplaceContext,
    events: {} as MarketplaceEvent,
  },
}).createMachine({
  id: 'marketplace',
  context: {
    memes: [],
    nextCursor: null,
    q: '',
    type: '',
    tier: '',
    listed: false,
    sortKey: 'new',
    sortDir: 'desc',
    err: null,
  },
  initial: 'loading',
  on: {
    SET_Q: { actions: assign({ q: ({ event }) => event.q }) },
    SET_TYPE: { actions: assign({ type: ({ event }) => event.value }) },
    SET_TIER: { actions: assign({ tier: ({ event }) => event.value }) },
    SET_LISTED: { actions: assign({ listed: ({ event }) => event.listed }) },
    SET_SORT: {
      actions: assign({
        sortKey: ({ event }) => event.sortKey,
        sortDir: ({ event }) => event.sortDir,
      }),
    },
    LOADED: [
      {
        guard: ({ event }) => event.memes.length === 0,
        target: '.empty',
        actions: assign({
          memes: ({ event }) => event.memes,
          nextCursor: ({ event }) => event.nextCursor,
          err: null,
        }),
      },
      {
        target: '.ready',
        actions: assign({
          memes: ({ event }) => event.memes,
          nextCursor: ({ event }) => event.nextCursor,
          err: null,
        }),
      },
    ],
    APPEND: {
      actions: assign({
        memes: ({ context, event }) => {
          const seen = new Set(context.memes.map((m) => m.id))
          return [...context.memes, ...event.memes.filter((m) => !seen.has(m.id))]
        },
        nextCursor: ({ event }) => event.nextCursor,
      }),
    },
    CURSOR: { actions: assign({ nextCursor: ({ event }) => event.nextCursor }) },
    FAIL: {
      target: '.error',
      actions: assign({
        memes: [],
        nextCursor: null,
        err: ({ event }) => event.err,
      }),
    },
  },
  states: {
    loading: {},
    ready: {},
    empty: {},
    error: {},
  },
})
