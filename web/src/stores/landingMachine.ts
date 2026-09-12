import { assign, setup } from 'xstate'

export type LandingPhase = 'loading' | 'ready' | 'loggingIn' | 'loginError'

export interface LandingContext {
  frames: Record<string, string>
  /** tiers whose composited demo card failed to load: the bare foil frame is the fallback source */
  fallbackFrames: string[]
  /** tiers with no usable image left: the slot keeps its box and renders as a tinted placeholder */
  brokenFrames: string[]
  busy: boolean
  err: string | null
}

export type LandingEvent =
  | { type: 'SET_FRAMES'; frames: Record<string, string> }
  | { type: 'FRAME_FALLBACK'; key: string }
  | { type: 'FRAME_FAILED'; key: string }
  | { type: 'LOGIN' }
  | { type: 'FAIL'; err: string }

const withKey = (keys: string[], key: string) => (keys.includes(key) ? keys : [...keys, key])

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
    fallbackFrames: [],
    brokenFrames: [],
    busy: false,
    err: null,
  },
  states: {
    frames: {
      /* image outcomes are recorded in both states: a new payload retries every tier from scratch */
      on: {
        FRAME_FALLBACK: {
          actions: assign({
            fallbackFrames: ({ context, event }) => withKey(context.fallbackFrames, event.key),
          }),
        },
        FRAME_FAILED: {
          actions: assign({
            brokenFrames: ({ context, event }) => withKey(context.brokenFrames, event.key),
          }),
        },
      },
      initial: 'loading',
      states: {
        loading: {
          on: {
            SET_FRAMES: {
              target: 'ready',
              actions: assign({ frames: ({ event }) => event.frames, fallbackFrames: [], brokenFrames: [] }),
            },
          },
        },
        ready: {
          on: {
            SET_FRAMES: {
              actions: assign({ frames: ({ event }) => event.frames, fallbackFrames: [], brokenFrames: [] }),
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
