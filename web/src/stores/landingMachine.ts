import { assign, setup } from 'xstate'

export type LandingPhase = 'ready' | 'loggingIn' | 'loginError'

export interface LandingContext {
  busy: boolean
  err: string | null
}

export type LandingEvent = { type: 'LOGIN' } | { type: 'FAIL'; err: string }

export const landingMachine = setup({
  types: {
    context: {} as LandingContext,
    events: {} as LandingEvent,
  },
  actions: { startLogin: () => {} },
}).createMachine({
  id: 'landing',
  initial: 'idle',
  context: { busy: false, err: null },
  states: {
    idle: {
      on: {
        LOGIN: {
          target: 'loggingIn',
          actions: [assign({ busy: true, err: null }), 'startLogin'],
        },
      },
    },
    loggingIn: {
      on: {
        FAIL: {
          target: 'loginError',
          actions: assign({ busy: false, err: ({ event }) => event.err }),
        },
      },
    },
    loginError: {
      on: {
        LOGIN: {
          target: 'loggingIn',
          actions: [assign({ busy: true, err: null }), 'startLogin'],
        },
      },
    },
  },
})
