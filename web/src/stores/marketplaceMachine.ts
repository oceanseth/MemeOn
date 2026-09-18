import { assign, setup } from 'xstate'
import type { Meme } from '../lib/types'
import type { SortDir, SortKey } from '../lib/sorting'

export type MarketplacePhase = 'loading' | 'ready' | 'empty' | 'error'

/** 'refresh' replaces the whole list, 'more' appends the next cursor page. */
export type MarketplaceBusy = 'idle' | 'refresh' | 'more'

export interface MarketplaceFilters {
  q: string
  type: string
  tier: string
  listed: boolean
  sortKey: SortKey
  sortDir: SortDir
}

export interface MarketplaceContext extends MarketplaceFilters {
  memes: Meme[]
  nextCursor: string | null
  err: string | null
  /** A failed continuation keeps its cursor: the page is retryable, not the end of the catalogue. */
  moreErr: string | null
  busy: MarketplaceBusy
  filtersOpen: boolean
}

/** Filters restored from the query string, so a shared or reloaded URL opens the same market. */
export type MarketplaceInput = Partial<MarketplaceFilters>

export type MarketplaceEvent =
  | { type: 'SET_Q'; q: string }
  | { type: 'SET_TYPE'; value: string }
  | { type: 'SET_TIER'; value: string }
  | { type: 'SET_LISTED'; listed: boolean }
  | { type: 'SET_SORT'; sortKey: SortKey; sortDir: SortDir }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'FETCHING'; scope: 'refresh' | 'more' }
  | { type: 'LOADED'; memes: Meme[]; nextCursor: string | null }
  | { type: 'APPEND'; memes: Meme[]; nextCursor: string | null }
  | { type: 'FAIL'; err: string }
  | { type: 'MORE_FAILED'; err: string }

/**
 * Marketplace list source of truth. loading → ready|empty|error, with `busy` carrying
 * in-flight refetches so a filter change never blanks the grid it is replacing.
 * The hook drives fetch, debounce, and infinite scroll; do not add React state here.
 */
export const marketplaceMachine = setup({
  types: {
    context: {} as MarketplaceContext,
    events: {} as MarketplaceEvent,
    input: {} as MarketplaceInput,
  },
}).createMachine({
  id: 'marketplace',
  context: ({ input }) => ({
    memes: [],
    nextCursor: null,
    q: input.q ?? '',
    type: input.type ?? '',
    tier: input.tier ?? '',
    listed: input.listed ?? false,
    sortKey: input.sortKey ?? 'new',
    sortDir: input.sortDir ?? 'desc',
    err: null,
    moreErr: null,
    busy: 'idle' as const,
    filtersOpen: false,
  }),
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
    CLEAR_FILTERS: {
      actions: assign({ q: '', type: '', tier: '', listed: false }),
    },
    TOGGLE_FILTERS: {
      actions: assign({ filtersOpen: ({ context }) => !context.filtersOpen }),
    },
    FETCHING: {
      actions: assign({
        busy: ({ event }) => event.scope,
        moreErr: ({ context, event }) => (event.scope === 'more' ? null : context.moreErr),
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
          moreErr: null,
          busy: 'idle',
        }),
      },
      {
        target: '.ready',
        actions: assign({
          memes: ({ event }) => event.memes,
          nextCursor: ({ event }) => event.nextCursor,
          err: null,
          moreErr: null,
          busy: 'idle',
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
        moreErr: null,
        busy: 'idle',
      }),
    },
    FAIL: {
      target: '.error',
      actions: assign({
        memes: [],
        nextCursor: null,
        err: ({ event }) => event.err,
        moreErr: null,
        busy: 'idle',
      }),
    },
    MORE_FAILED: {
      actions: assign({
        moreErr: ({ event }) => event.err,
        busy: 'idle',
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
