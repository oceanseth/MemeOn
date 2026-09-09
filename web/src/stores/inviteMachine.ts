import { assign, setup } from 'xstate'
import type { Meme } from '../lib/types'

export type InvitePhase = 'loading' | 'ready' | 'accepting' | 'error'

/** Whether the owner's own link made it to the clipboard. */
export type InviteCopyState = 'idle' | 'copied' | 'failed'

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
  accepted: boolean
  copy: InviteCopyState
}

export type InviteEvent =
  | { type: 'DONE'; data: InviteData }
  | { type: 'ACCEPT' }
  | { type: 'ACCEPTED' }
  | { type: 'JOIN' }
  | { type: 'COPIED'; ok: boolean }
  | { type: 'FAIL'; err: string }

/**
 * Invite source of truth. loading → ready|error; accept is accepting then navigate.
 * Accepting records its outcome (`accepted`) so the confirmation is state, not a side effect,
 * and `error` keeps a JOIN exit so a dead link is never terminal. The hook drives async work.
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
    accepted: false,
    copy: 'idle',
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
        COPIED: {
          actions: assign({ copy: ({ event }) => (event.ok ? 'copied' : 'failed') }),
        },
      },
    },
    accepting: {
      on: {
        ACCEPTED: {
          target: 'ready',
          actions: assign({ busy: false, accepted: true }),
        },
        FAIL: {
          target: 'ready',
          actions: assign({ busy: false, err: ({ event }) => event.err }),
        },
      },
    },
    // a dead invite still has a way into the product: JOIN starts a plain Masky signup
    error: {
      on: {
        JOIN: {
          target: 'accepting',
          actions: assign({ busy: true }),
        },
      },
    },
  },
})
