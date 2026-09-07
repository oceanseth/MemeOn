import { assign, fromPromise, setup } from 'xstate'
import { apiFetch, ApiError, clearSession, sessionToken } from '../lib/api'
import { firebaseSignOut } from '../lib/firebase'
import type { Me } from '../lib/types'

export type AuthEvent = { type: 'START' } | { type: 'LOGOUT' }

export interface AuthContext {
  user: Me | null
  error: string | null
}

async function loadMe(): Promise<Me | null> {
  if (!sessionToken()) return null
  try {
    return await apiFetch<Me>('/api/me')
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearSession()
      return null
    }
    throw err
  }
}

/**
 * Auth source of truth. MobX copies the snapshot; do not add React state here.
 * Non-401 fetch failures stay user=null and leave loading, matching AuthContext.
 */
export const authMachine = setup({
  types: {
    context: {} as AuthContext,
    events: {} as AuthEvent,
  },
  actors: {
    loadMe: fromPromise(loadMe),
  },
  actions: {
    clearSessionAndFirebase: () => {
      clearSession()
      firebaseSignOut()
    },
  },
}).createMachine({
  id: 'auth',
  context: { user: null, error: null },
  initial: 'idle',
  states: {
    idle: {
      on: { START: 'loading' },
    },
    loading: {
      invoke: {
        src: 'loadMe',
        onDone: [
          {
            guard: ({ event }) => event.output !== null,
            target: 'ready',
            actions: assign({ user: ({ event }) => event.output, error: null }),
          },
          {
            target: 'unauthenticated',
            actions: assign({ user: () => null, error: null }),
          },
        ],
        onError: {
          target: 'unauthenticated',
          actions: assign({
            user: () => null,
            error: ({ event }) =>
              event.error instanceof Error ? event.error.message : 'auth failed',
          }),
        },
      },
    },
    ready: {
      tags: ['settled'],
      on: { START: 'loading', LOGOUT: { target: 'unauthenticated', actions: 'clearSessionAndFirebase' } },
    },
    unauthenticated: {
      tags: ['settled'],
      on: { START: 'loading' },
    },
    error: {
      tags: ['settled'],
      on: { START: 'loading' },
    },
  },
})
