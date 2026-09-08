import { assign, setup } from 'xstate'

export type DevelopersPhase = 'loading' | 'ready' | 'empty' | 'error'

export interface KeyRow {
  prefix: string
  label: string
  createdAt: string
}

export interface DevelopersContext {
  keys: KeyRow[] | null
  label: string
  freshKey: string | null
  revoking: KeyRow | null
  err: string | null
  copied: boolean
}

export type DevelopersEvent =
  | { type: 'SET_KEYS'; keys: KeyRow[] }
  | { type: 'SET_LABEL'; label: string }
  | { type: 'CREATED'; key: string }
  | { type: 'FAIL'; err: string }
  | { type: 'COPIED' }
  | { type: 'COPY_RESET' }
  | { type: 'REVOKE'; row: KeyRow }
  | { type: 'REVOKE_CANCEL' }
  | { type: 'REVOKED' }

/**
 * Developers API-key source of truth. loading → ready|empty; create/revoke stay on the list.
 * The hook drives async work and sends events.
 */
export const developersMachine = setup({
  types: {
    context: {} as DevelopersContext,
    events: {} as DevelopersEvent,
  },
}).createMachine({
  id: 'developers',
  context: {
    keys: null,
    label: '',
    freshKey: null,
    revoking: null,
    err: null,
    copied: false,
  },
  initial: 'loading',
  on: {
    SET_LABEL: { actions: assign({ label: ({ event }) => event.label }) },
    SET_KEYS: [
      {
        guard: ({ event }) => event.keys.length === 0,
        target: '.empty',
        actions: assign({ keys: ({ event }) => event.keys }),
      },
      {
        target: '.ready',
        actions: assign({ keys: ({ event }) => event.keys }),
      },
    ],
    CREATED: {
      target: '.ready',
      actions: assign({
        freshKey: ({ event }) => event.key,
        label: '',
        err: null,
        copied: false,
      }),
    },
    FAIL: {
      target: '.error',
      actions: assign({ err: ({ event }) => event.err }),
    },
    COPIED: { actions: assign({ copied: true }) },
    COPY_RESET: { actions: assign({ copied: false }) },
    REVOKE: { actions: assign({ revoking: ({ event }) => event.row }) },
    REVOKE_CANCEL: { actions: assign({ revoking: null }) },
    REVOKED: { actions: assign({ revoking: null }) },
  },
  states: {
    loading: {},
    ready: {},
    empty: {},
    error: {},
  },
})
