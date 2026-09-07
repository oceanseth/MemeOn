import { setup } from 'xstate'

export type AuthEvent =
  | { type: 'START' }
  | { type: 'RESOLVE_READY' }
  | { type: 'RESOLVE_UNAUTHENTICATED' }
  | { type: 'FAIL' }
  | { type: 'LOGOUT' }

/**
 * Skeleton only. Engine worktree (mo-9dg.4) fills transitions and context.
 * States match the ox/ui plan: idle → loading → ready | unauthenticated | error.
 */
export const authMachine = setup({
  types: {
    events: {} as AuthEvent,
  },
}).createMachine({
  id: 'auth',
  initial: 'idle',
  states: {
    idle: {
      on: { START: 'loading' },
    },
    loading: {
      on: {
        RESOLVE_READY: 'ready',
        RESOLVE_UNAUTHENTICATED: 'unauthenticated',
        FAIL: 'error',
      },
    },
    ready: {
      on: { LOGOUT: 'unauthenticated', START: 'loading' },
    },
    unauthenticated: {
      on: { START: 'loading' },
    },
    error: {
      on: { START: 'loading' },
    },
  },
})
