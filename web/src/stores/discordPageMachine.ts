import { assign, setup } from 'xstate'

export type DiscordPagePhase = 'loading' | 'ready'

export interface DiscordPageContext {
  installUrl: string | null
  loaded: boolean
}

export type DiscordPageEvent = { type: 'DONE'; installUrl: string | null }

/**
 * Discord landing source of truth. loading → ready (with or without an install URL).
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
    loaded: false,
  },
  initial: 'loading',
  on: {
    DONE: {
      target: '.ready',
      actions: assign({
        installUrl: ({ event }) => event.installUrl,
        loaded: true,
      }),
    },
  },
  states: {
    loading: {},
    ready: {},
  },
})
