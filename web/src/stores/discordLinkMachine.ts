import { assign, setup } from 'xstate'

export type DiscordLinkPhase = 'working' | 'done' | 'error'

export interface DiscordLinkContext {
  err: string | null
}

export type DiscordLinkEvent = { type: 'DONE' } | { type: 'FAIL'; err: string }

/**
 * Discord account-link source of truth. working → done|error.
 * The hook drives login + POST and sends events.
 */
export const discordLinkMachine = setup({
  types: {
    context: {} as DiscordLinkContext,
    events: {} as DiscordLinkEvent,
  },
}).createMachine({
  id: 'discordLink',
  context: { err: null },
  initial: 'working',
  states: {
    working: {
      on: {
        DONE: 'done',
        FAIL: {
          target: 'error',
          actions: assign({ err: ({ event }) => event.err }),
        },
      },
    },
    done: {},
    error: {},
  },
})
