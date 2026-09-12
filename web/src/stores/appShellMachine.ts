import { assign, setup } from 'xstate'
import type { Alert, Meme, QuestStep } from '../lib/types'

export type AppShellPhase = 'loggedOut' | 'loggedIn'

export interface AppShellContext {
  steps: QuestStep[] | null
  packMemes: Meme[] | null
  packReward: number
  packBusy: boolean
  claimError: string | null
  alerts: Alert[]
  alertsOpen: boolean
  alertsError: boolean
  /** Alerts that were unread when the popover opened: reading them must not erase the cue. */
  wasUnread: string[]
  questDismissed: boolean
}

export type AppShellEvent =
  | { type: 'LOGGED_IN' }
  | { type: 'LOGGED_OUT' }
  | { type: 'SET_STEPS'; steps: QuestStep[] }
  | { type: 'SET_ALERTS'; alerts: Alert[] }
  | { type: 'SET_ALERTS_FAIL' }
  | { type: 'OPEN_ALERTS' }
  | { type: 'CLOSE_ALERTS' }
  | { type: 'MARK_READ'; ids: string[] }
  | { type: 'CLAIM_START' }
  | { type: 'CLAIM_DONE'; memes: Meme[]; reward: number }
  | { type: 'CLAIM_FAIL' }
  | { type: 'DISMISS_PACK' }
  | { type: 'DISMISS_QUESTS' }

const EMPTY: AppShellContext = {
  steps: null,
  packMemes: null,
  packReward: 0,
  packBusy: false,
  claimError: null,
  alerts: [],
  alertsOpen: false,
  alertsError: false,
  wasUnread: [],
  questDismissed: false,
}

const doneCount = (steps: QuestStep[] | null): number =>
  steps?.filter((step) => step.done).length ?? 0

/** A poll that returns the same list must not re-render the chrome below the shell. */
const sameAlerts = (a: Alert[], b: Alert[]): boolean =>
  a.length === b.length && a.every((alert, index) => {
    const other = b[index]
    return !!other && other.id === alert.id && other.read === alert.read
  })

/**
 * App chrome source of truth. loggedOut ↔ loggedIn; quests, pack, and alerts live here.
 * The hook drives fetch/open and sends events.
 */
export const appShellMachine = setup({
  types: {
    context: {} as AppShellContext,
    events: {} as AppShellEvent,
  },
}).createMachine({
  id: 'appShell',
  context: { ...EMPTY },
  initial: 'loggedOut',
  states: {
    loggedOut: {
      on: { LOGGED_IN: 'loggedIn' },
    },
    loggedIn: {
      on: {
        LOGGED_OUT: {
          target: 'loggedOut',
          actions: assign({ ...EMPTY }),
        },
        SET_STEPS: {
          actions: assign({
            steps: ({ event }) => event.steps,
            /* a completion is a reward beat: the strip earns its way back onto the page */
            questDismissed: ({ context, event }) =>
              doneCount(event.steps) > doneCount(context.steps) ? false : context.questDismissed,
          }),
        },
        SET_ALERTS: {
          guard: ({ context, event }) =>
            context.alertsError || !sameAlerts(context.alerts, event.alerts),
          actions: assign({
            alerts: ({ event }) => event.alerts,
            alertsError: false,
          }),
        },
        SET_ALERTS_FAIL: {
          guard: ({ context }) => !context.alertsError,
          actions: assign({ alertsError: true }),
        },
        OPEN_ALERTS: {
          guard: ({ context }) => !context.alertsOpen,
          actions: assign({ alertsOpen: true }),
        },
        CLOSE_ALERTS: {
          guard: ({ context }) => context.alertsOpen || context.wasUnread.length > 0,
          actions: assign({ alertsOpen: false, wasUnread: [] }),
        },
        MARK_READ: {
          actions: assign({
            alerts: ({ context }) => context.alerts.map((a) => ({ ...a, read: true })),
            wasUnread: ({ event }) => event.ids,
          }),
        },
        CLAIM_START: { actions: assign({ packBusy: true, claimError: null }) },
        CLAIM_DONE: {
          actions: assign({
            packBusy: false,
            claimError: null,
            packMemes: ({ event }) => event.memes,
            packReward: ({ event }) => event.reward,
            steps: ({ context }) =>
              context.steps?.map((s) => (s.key === 'pack' ? { ...s, done: true } : s)) ?? null,
          }),
        },
        CLAIM_FAIL: {
          actions: assign({
            packBusy: false,
            claimError: "Pack didn't open — tap to try again.",
          }),
        },
        DISMISS_PACK: { actions: assign({ packMemes: null }) },
        DISMISS_QUESTS: {
          actions: assign({ questDismissed: true }),
        },
      },
    },
  },
})
