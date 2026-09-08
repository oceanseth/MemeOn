import { assign, setup } from 'xstate'
import type { Alert, Meme, QuestStep } from '../lib/types'

export type AppShellPhase = 'loggedOut' | 'loggedIn'

export interface AppShellContext {
  steps: QuestStep[] | null
  packMemes: Meme[] | null
  packReward: number
  packBusy: boolean
  alerts: Alert[]
  alertsOpen: boolean
}

export type AppShellEvent =
  | { type: 'LOGGED_IN' }
  | { type: 'LOGGED_OUT' }
  | { type: 'SET_STEPS'; steps: QuestStep[] }
  | { type: 'SET_ALERTS'; alerts: Alert[] }
  | { type: 'OPEN_ALERTS' }
  | { type: 'CLOSE_ALERTS' }
  | { type: 'MARK_READ' }
  | { type: 'CLAIM_START' }
  | { type: 'CLAIM_DONE'; memes: Meme[]; reward: number }
  | { type: 'CLAIM_FAIL' }
  | { type: 'DISMISS_PACK' }

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
  context: {
    steps: null,
    packMemes: null,
    packReward: 0,
    packBusy: false,
    alerts: [],
    alertsOpen: false,
  },
  initial: 'loggedOut',
  states: {
    loggedOut: {
      on: { LOGGED_IN: 'loggedIn' },
    },
    loggedIn: {
      on: {
        LOGGED_OUT: {
          target: 'loggedOut',
          actions: assign({
            steps: null,
            packMemes: null,
            packReward: 0,
            packBusy: false,
            alerts: [],
            alertsOpen: false,
          }),
        },
        SET_STEPS: { actions: assign({ steps: ({ event }) => event.steps }) },
        SET_ALERTS: { actions: assign({ alerts: ({ event }) => event.alerts }) },
        OPEN_ALERTS: { actions: assign({ alertsOpen: true }) },
        CLOSE_ALERTS: { actions: assign({ alertsOpen: false }) },
        MARK_READ: {
          actions: assign({
            alerts: ({ context }) => context.alerts.map((a) => ({ ...a, read: true })),
          }),
        },
        CLAIM_START: { actions: assign({ packBusy: true }) },
        CLAIM_DONE: {
          actions: assign({
            packBusy: false,
            packMemes: ({ event }) => event.memes,
            packReward: ({ event }) => event.reward,
            steps: ({ context }) =>
              context.steps?.map((s) => (s.key === 'pack' ? { ...s, done: true } : s)) ?? null,
          }),
        },
        CLAIM_FAIL: { actions: assign({ packBusy: false }) },
        DISMISS_PACK: { actions: assign({ packMemes: null }) },
      },
    },
  },
})
