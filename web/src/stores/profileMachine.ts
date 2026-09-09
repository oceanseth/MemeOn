import { assign, setup } from 'xstate'
import type { Meme } from '../lib/types'

export type ProfileTab = 'created' | 'binder'
export type ProfilePhase = 'loading' | 'ready' | 'error'

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
}

export type ProfileEvent =
  | { type: 'DONE'; data: ProfileData }
  | { type: 'FAIL'; err: string }
  | { type: 'SET_TAB'; tab: ProfileTab }

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
  context: ({ input }) => ({ data: null, tab: input.initialTab ?? 'created', err: null }),
  on: {
    SET_TAB: { actions: assign({ tab: ({ event }) => event.tab }) },
    DONE: {
      target: '.ready',
      actions: assign({ data: ({ event }) => event.data }),
    },
    FAIL: { target: '.error', actions: assign({ err: ({ event }) => event.err }) },
  },
  states: { loading: {}, ready: {}, error: {} },
})
