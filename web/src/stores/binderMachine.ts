import { assign } from 'xstate'
import type { Meme } from '../lib/types'
import type { SortDir, SortKey } from '../lib/sorting'
import { createListPhaseMachine } from './listPhaseMachine'

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
 * Own-binder source of truth. Filter/sort/page live in extraOn; the hook drives fetch.
 * onRetry is omitted so RETRY clears err only — visibleLimit / sort / private survive.
 */
export const binderMachine = createListPhaseMachine<BinderContext, BinderEvent>({
  id: 'binder',
  context: {
    memes: [],
    showPrivate: false,
    sortKey: 'new',
    sortDir: 'desc',
    visibleLimit: BINDER_PAGE_SIZE,
    err: null,
  },
  isEmpty: ({ event }) => event.memes.length === 0,
  applyDone: assign({
    memes: ({ event }: { event: Extract<BinderEvent, { type: 'DONE' }> }) => event.memes,
  }),
  extraOn: {
    /* a filter or a sort re-shuffles which cards are first, so the page starts over with them */
    SET_SHOW_PRIVATE: {
      actions: assign({
        showPrivate: ({ event }: { event: Extract<BinderEvent, { type: 'SET_SHOW_PRIVATE' }> }) =>
          event.showPrivate,
        visibleLimit: BINDER_PAGE_SIZE,
      }),
    },
    SET_SORT: {
      actions: assign({
        sortKey: ({ event }: { event: Extract<BinderEvent, { type: 'SET_SORT' }> }) => event.sortKey,
        sortDir: ({ event }: { event: Extract<BinderEvent, { type: 'SET_SORT' }> }) => event.sortDir,
        visibleLimit: BINDER_PAGE_SIZE,
      }),
    },
    SHOW_MORE: {
      actions: assign({
        visibleLimit: ({ context }: { context: BinderContext }) =>
          context.visibleLimit + BINDER_PAGE_SIZE,
      }),
    },
  },
})
