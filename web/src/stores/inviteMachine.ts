import { assign, setup } from 'xstate'
import type { Meme } from '../lib/types'

export type InvitePhase = 'loading' | 'ready' | 'accepting' | 'error'

export interface InviteInviter {
  sub: string
  name: string
  picture: string | null
  followers: number
  collectionSize: number
  portfolioValue: number
}

export interface InviteData {
  inviter: InviteInviter
  topMemes: Meme[]
}

export interface InviteContext {
  data: InviteData | null
  err: string | null
  busy: boolean
}

export type InviteEvent =
  | { type: 'DONE'; data: InviteData }
  | { type: 'ACCEPT' }
  | { type: 'ACCEPTED' }
  | { type: 'FAIL'; err: string }

/**
 * Invite source of truth. loading → ready|error; accept is accepting then navigate.
 * The hook drives async work and sends events.
 */
export const inviteMachine = setup({
  types: {
    context: {} as InviteContext,
    events: {} as InviteEvent,
  },
}).createMachine({
  id: 'invite',
  context: {
    data: null,
    err: null,
    busy: false,
  },
  initial: 'loading',
  states: {
    loading: {
      on: {
        DONE: {
          target: 'ready',
          actions: assign({ data: ({ event }) => event.data, err: null }),
        },
        FAIL: {
          target: 'error',
          actions: assign({ err: ({ event }) => event.err }),
        },
      },
    },
    ready: {
      on: {
        ACCEPT: {
          target: 'accepting',
          actions: assign({ busy: true, err: null }),
        },
      },
    },
    accepting: {
      on: {
        ACCEPTED: {
          target: 'ready',
          actions: assign({ busy: false }),
        },
        FAIL: {
          target: 'ready',
          actions: assign({ busy: false, err: ({ event }) => event.err }),
        },
      },
    },
    error: {},
  },
})
