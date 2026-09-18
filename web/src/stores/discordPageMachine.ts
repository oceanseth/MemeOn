import { assign, setup } from 'xstate'

export type DiscordPagePhase = 'loading' | 'ready' | 'errored'

export interface DiscordPageContext {
  installUrl: string | null
}

export type DiscordPageEvent = { type: 'DONE'; installUrl: string | null } | { type: 'FAIL' }

/**
 * Discord landing source of truth. loading → ready (with or without an install URL) | errored.
 * "Configured without an install URL" and "we never reached the API" are different answers.
 */
export const discordPageMachine = setup({
  types: {
    context: {} as DiscordPageContext,
    events: {} as DiscordPageEvent,
  },
}).createMachine({
  id: 'discordPage',
  context: {
    installUrl: null,
  },
  initial: 'loading',
  on: {
    DONE: {
      target: '.ready',
      actions: assign({
        installUrl: ({ event }) => event.installUrl,
      }),
    },
    FAIL: { target: '.errored' },
  },
  states: {
    loading: {},
    ready: {},
    errored: {},
  },
})
