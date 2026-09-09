import { assign, setup } from 'xstate'

export type LandingPhase = 'loading' | 'ready' | 'loggingIn' | 'loginError'

export interface LandingContext {
  frames: Record<string, string>
  busy: boolean
  err: string | null
}

export type LandingEvent =
  | { type: 'SET_FRAMES'; frames: Record<string, string> }
  | { type: 'LOGIN' }
  | { type: 'FAIL'; err: string }

/** Frame readiness and login activity settle independently. */
export const landingMachine = setup({
  types: {
    context: {} as LandingContext,
    events: {} as LandingEvent,
  },
  actions: {
    startLogin: () => {},
  },
}).createMachine({
  id: 'landing',
  type: 'parallel',
  context: {
    frames: {},
    busy: false,
    err: null,
  },
  states: {
    frames: {
      initial: 'loading',
      states: {
        loading: {
          on: {
            SET_FRAMES: {
              target: 'ready',
              actions: assign({ frames: ({ event }) => event.frames }),
            },
          },
        },
        ready: {
          on: {
            SET_FRAMES: {
              actions: assign({ frames: ({ event }) => event.frames }),
            },
          },
        },
      },
    },
    login: {
      initial: 'idle',
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
    },
  },
})
