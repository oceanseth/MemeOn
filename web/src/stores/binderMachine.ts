import { assign, setup } from 'xstate'
import type { Meme } from '../lib/types'
import type { SortDir, SortKey } from '../lib/sorting'

export type BinderPhase = 'loading' | 'ready' | 'empty' | 'error'

/** Cards visible before "Show N more". Twelve fills desktop three-up (four rows) and phone two-up. Shared with ProfileScreen's binder tab. */
export const BINDER_PAGE_SIZE = 12

export interface BinderContext {
  memes: Meme[]
  showPrivate: boolean
  sortKey: SortKey
  sortDir: SortDir
  /** how many of the filtered cards the grid is currently allowed to paint */
  visibleLimit: number
  err: string | null
}

export type BinderEvent =
  | { type: 'DONE'; memes: Meme[] }
  | { type: 'FAIL'; err: string }
  | { type: 'RETRY' }
  | { type: 'SET_SHOW_PRIVATE'; showPrivate: boolean }
  | { type: 'SET_SORT'; sortKey: SortKey; sortDir: SortDir }
  | { type: 'SHOW_MORE' }

/**
 * Own-binder source of truth. loading → ready|empty|error, and error → loading on RETRY.
 * Filter/sort/page live in context; the hook drives fetch.
 */
export const binderMachine = setup({
  types: {
    context: {} as BinderContext,
    events: {} as BinderEvent,
  },
}).createMachine({
  id: 'binder',
  context: {
    memes: [],
    showPrivate: false,
    sortKey: 'new',
    sortDir: 'desc',
    visibleLimit: BINDER_PAGE_SIZE,
    err: null,
  },
  initial: 'loading',
  on: {
    /* a filter or a sort re-shuffles which cards are first, so the page starts over with them */
    SET_SHOW_PRIVATE: {
      actions: assign({
        showPrivate: ({ event }) => event.showPrivate,
        visibleLimit: BINDER_PAGE_SIZE,
      }),
    },
    SET_SORT: {
      actions: assign({
        sortKey: ({ event }) => event.sortKey,
        sortDir: ({ event }) => event.sortDir,
        visibleLimit: BINDER_PAGE_SIZE,
      }),
    },
    SHOW_MORE: {
      actions: assign({ visibleLimit: ({ context }) => context.visibleLimit + BINDER_PAGE_SIZE }),
    },
    DONE: [
      {
        guard: ({ event }) => event.memes.length === 0,
        target: '.empty',
        actions: assign({ memes: ({ event }) => event.memes, err: null }),
      },
      {
        target: '.ready',
        actions: assign({ memes: ({ event }) => event.memes, err: null }),
      },
    ],
    FAIL: {
      target: '.error',
      actions: assign({ err: ({ event }) => event.err }),
    },
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
