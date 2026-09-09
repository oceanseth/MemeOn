import { assign, setup } from 'xstate'
import type { Meme } from '../lib/types'
import type { SortDir, SortKey } from '../lib/sorting'

export type BinderPhase = 'loading' | 'ready' | 'empty' | 'error'

export interface BinderContext {
  memes: Meme[]
  showPrivate: boolean
  sortKey: SortKey
  sortDir: SortDir
  err: string | null
}

export type BinderEvent =
  | { type: 'DONE'; memes: Meme[] }
  | { type: 'FAIL'; err: string }
  | { type: 'RETRY' }
  | { type: 'SET_SHOW_PRIVATE'; showPrivate: boolean }
  | { type: 'SET_SORT'; sortKey: SortKey; sortDir: SortDir }

/**
 * Own-binder source of truth. loading → ready|empty|error, and error → loading on RETRY.
 * Filter/sort live in context; the hook drives fetch.
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
    err: null,
  },
  initial: 'loading',
  on: {
    SET_SHOW_PRIVATE: { actions: assign({ showPrivate: ({ event }) => event.showPrivate }) },
    SET_SORT: {
      actions: assign({
        sortKey: ({ event }) => event.sortKey,
        sortDir: ({ event }) => event.sortDir,
      }),
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
