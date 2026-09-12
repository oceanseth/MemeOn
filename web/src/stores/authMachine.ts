import { assign, fromPromise, setup } from 'xstate'
import { apiFetch, ApiError, clearSession, sessionToken } from '../lib/api'
import { firebaseSignOut } from '../lib/firebase'
import type { Me } from '../lib/types'

export type AuthEvent = { type: 'START' } | { type: 'LOGOUT' }

export interface AuthContext {
  user: Me | null
  error: string | null
}

async function loadMe({ signal }: { signal: AbortSignal }): Promise<Me | null> {
  if (!sessionToken()) return null
  try {
    return await apiFetch<Me>('/api/me', { signal })
  } catch (err) {
    // A canceled load must not clear credentials from a later login.
    if (signal.aborted) return null
    if (err instanceof ApiError && err.status === 401) {
      clearSession()
      return null
    }
    throw err
  }
}

function authErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'auth failed'
}

/**
 * Auth source of truth. MobX copies the snapshot; do not add React state here.
 * Initial failures settle without a user; refresh failures retain the current user.
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
  on: {
    LOGOUT: {
      target: '.unauthenticated',
      actions: [assign({ user: null, error: null }), 'clearSessionAndFirebase'],
    },
  },
  states: {
    idle: {
      on: { START: 'loading' },
    },
    loading: {
      on: { START: { target: 'loading', reenter: true } },
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
        onError: [
          {
            guard: ({ context }) => context.user !== null,
            target: 'ready',
            actions: assign({ error: ({ event }) => authErrorMessage(event.error) }),
          },
          {
            target: 'error',
            actions: assign({ user: null, error: ({ event }) => authErrorMessage(event.error) }),
          },
        ],
      },
    },
    ready: {
      tags: ['settled'],
      on: { START: 'loading' },
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
