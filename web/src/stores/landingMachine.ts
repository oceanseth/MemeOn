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

/**
 * Landing source of truth. loading → ready; login may go loggingIn → loginError.
 * Frame fetch failures stay ready with empty frames, matching the page.
 */
export const landingMachine = setup({
  types: {
    context: {} as LandingContext,
    events: {} as LandingEvent,
  },
}).createMachine({
  id: 'landing',
  context: {
    frames: {},
    busy: false,
    err: null,
  },
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
        LOGIN: {
          target: 'loggingIn',
          actions: assign({ busy: true, err: null }),
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
          actions: assign({ busy: true, err: null }),
        },
      },
    },
  },
})
