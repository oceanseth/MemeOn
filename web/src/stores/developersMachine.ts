import { assign, setup } from 'xstate'

/** The list's own truth, and nothing else: `error` means the fetch failed, never that a write did. */
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
  /** create / copy failures: a page-level notice, kept apart from the list phase */
  err: string | null
  /** revoke failure, shown inside the open dialog because the rest of the page is inert */
  revokeErr: string | null
  okMsg: string | null
  creating: boolean
  revokeBusy: boolean
  copied: boolean
}

export type DevelopersEvent =
  | { type: 'SET_KEYS'; keys: KeyRow[] }
  | { type: 'LOAD_FAIL' }
  | { type: 'RELOAD' }
  | { type: 'SET_LABEL'; label: string }
  | { type: 'CREATE_START' }
  | { type: 'CREATED'; key: string }
  | { type: 'FAIL'; err: string }
  | { type: 'COPIED' }
  | { type: 'COPY_RESET' }
  | { type: 'REVOKE'; row: KeyRow }
  | { type: 'REVOKE_CANCEL' }
  | { type: 'REVOKE_START' }
  | { type: 'REVOKE_FAIL'; err: string }
  | { type: 'REVOKE_OK'; label: string }

/**
 * Developers API-key source of truth. loading → ready|empty|error; create/revoke stay on the list
 * and report through context. The hook drives async work and sends events.
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
    revokeErr: null,
    okMsg: null,
    creating: false,
    revokeBusy: false,
    copied: false,
  },
  initial: 'loading',
  on: {
    // typing is the user's answer to the banner: it goes away
    SET_LABEL: { actions: assign({ label: ({ event }) => event.label, err: null }) },
    // a background reload must not wipe a notice the user has not read yet: only the user's own
    // next action (typing a label, starting a create, a successful revoke, a retry) clears `err`
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
    // the list is unknown, not empty
    LOAD_FAIL: { target: '.error', actions: assign({ creating: false }) },
    RELOAD: { target: '.loading', actions: assign({ err: null }) },
    CREATE_START: {
      actions: assign({ creating: true, err: null, okMsg: null, freshKey: null, copied: false }),
    },
    CREATED: {
      target: '.ready',
      actions: assign({
        freshKey: ({ event }) => event.key,
        label: '',
        err: null,
        copied: false,
        creating: false,
      }),
    },
    FAIL: { actions: assign({ err: ({ event }) => event.err, creating: false }) },
    COPIED: { actions: assign({ copied: true }) },
    COPY_RESET: { actions: assign({ copied: false }) },
    REVOKE: { actions: assign({ revoking: ({ event }) => event.row, revokeErr: null, okMsg: null }) },
    REVOKE_CANCEL: { actions: assign({ revoking: null, revokeBusy: false, revokeErr: null }) },
    REVOKE_START: { actions: assign({ revokeBusy: true, revokeErr: null }) },
    // the dialog stays open on failure, so the retry is one click from where the user already is
    REVOKE_FAIL: { actions: assign({ revokeErr: ({ event }) => event.err, revokeBusy: false }) },
    REVOKE_OK: {
      actions: assign({
        revoking: null,
        revokeBusy: false,
        revokeErr: null,
        err: null,
        okMsg: ({ event }) => `Revoked ${event.label}.`,
      }),
    },
  },
  states: {
    loading: {},
    ready: {},
    empty: {},
    error: {},
  },
})
