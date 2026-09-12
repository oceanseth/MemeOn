import { assign, setup } from 'xstate'
import type { Meme } from '../lib/types'
import { BINDER_PAGE_SIZE } from './binderMachine'

export type ProfileTab = 'created' | 'binder'
/** 404 means the link is dead; anything else (500, timeout, offline) is a transport failure. */
export type ProfileErrKind = 'notfound' | 'transport'

export interface ProfileData {
  profile: {
    sub: string
    name: string
    picture: string | null
    followers: number
    collectionSize: number
    portfolioValue: number
  }
  followingByMe: boolean
  friendStatus: 'incoming' | 'outgoing' | 'accepted' | null
  created: Meme[]
  binder: (Meme & { shares: number })[]
}

export interface ProfileContext {
  data: ProfileData | null
  tab: ProfileTab
  err: string | null
  errKind: ProfileErrKind | null
  busy: boolean
  actionErr: string | null
  /** how many cards of the selected tab are on screen; the binder's own page size, shared */
  visibleLimit: number
}

export type ProfileEvent =
  | { type: 'DONE'; data: ProfileData }
  | { type: 'FAIL'; err: string; kind: ProfileErrKind }
  | { type: 'SET_TAB'; tab: ProfileTab }
  | { type: 'SHOW_MORE' }
  | { type: 'BEGIN_ACTION' }
  | { type: 'SET_FOLLOWING'; following: boolean }
  | { type: 'SETTLE_ACTION' }
  | { type: 'FAIL_ACTION'; err: string }

/** Profile loads and relationship reloads retain the selected tab and current data. */
export const profileMachine = setup({
  types: {
    context: {} as ProfileContext,
    input: {} as { initialTab?: ProfileTab },
    events: {} as ProfileEvent,
  },
}).createMachine({
  id: 'profile',
  initial: 'loading',
  context: ({ input }) => ({
    data: null,
    tab: input.initialTab ?? 'created',
    err: null,
    errKind: null,
    busy: false,
    actionErr: null,
    visibleLimit: BINDER_PAGE_SIZE,
  }),
  on: {
    /* a tab is a different collection, so it starts at page one; a relationship reload (DONE) is
       the same collection and keeps whatever the reader has already paged in */
    SET_TAB: { actions: assign({ tab: ({ event }) => event.tab, visibleLimit: BINDER_PAGE_SIZE }) },
    SHOW_MORE: {
      actions: assign({ visibleLimit: ({ context }) => context.visibleLimit + BINDER_PAGE_SIZE }),
    },
    DONE: {
      target: '.ready',
      actions: assign({ data: ({ event }) => event.data, err: null, errKind: null }),
    },
    FAIL: {
      target: '.error',
      actions: assign({ err: ({ event }) => event.err, errKind: ({ event }) => event.kind }),
    },
    /* relationship mutations keep the loaded profile on screen; only busy/actionErr move */
    BEGIN_ACTION: { actions: assign({ busy: true, actionErr: null }) },
    SET_FOLLOWING: {
      actions: assign({
        data: ({ context, event }) =>
          context.data ? { ...context.data, followingByMe: event.following } : null,
      }),
    },
    SETTLE_ACTION: { actions: assign({ busy: false }) },
    FAIL_ACTION: { actions: assign({ busy: false, actionErr: ({ event }) => event.err }) },
  },
  states: { loading: {}, ready: {}, error: {} },
})
