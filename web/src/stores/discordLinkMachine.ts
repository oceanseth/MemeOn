import { assign, setup } from 'xstate'

export type DiscordLinkPhase =
  | 'checking'
  | 'confirm'
  | 'redirecting'
  | 'working'
  | 'done'
  | 'error'

/** Why the link failed, in product terms. The hook maps transport detail onto exactly one of these. */
export type DiscordLinkFailure = 'missing-token' | 'expired' | 'login' | 'unreachable'

export interface DiscordLinkContext {
  failure: DiscordLinkFailure | null
}

export type DiscordLinkEvent =
  | { type: 'READY' }
  | { type: 'LOGIN' }
  | { type: 'LINK' }
  | { type: 'RETRY' }
  | { type: 'DONE' }
  | { type: 'FAIL'; failure: DiscordLinkFailure }

/**
 * Discord account-link source of truth. checking → confirm → redirecting|working → done|error,
 * and error → working on RETRY. Joining two identities waits for a person to say so.
 * The hook drives login + POST and sends events.
 */
export const discordLinkMachine = setup({
  types: {
    context: {} as DiscordLinkContext,
    events: {} as DiscordLinkEvent,
  },
}).createMachine({
  id: 'discordLink',
  context: { failure: null },
  initial: 'checking',
  on: {
    FAIL: {
      target: '.error',
      actions: assign({ failure: ({ event }) => event.failure }),
    },
  },
  states: {
    checking: { on: { READY: 'confirm', LINK: 'working' } },
    confirm: { on: { LOGIN: 'redirecting', LINK: 'working' } },
    redirecting: {},
    working: { on: { DONE: 'done' } },
    done: {},
    error: {
      on: { RETRY: { target: 'working', actions: assign({ failure: null }) } },
    },
  },
})
