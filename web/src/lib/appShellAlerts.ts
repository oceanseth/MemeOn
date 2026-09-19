import type { Actor } from 'xstate'
import { appShellMachine } from '../stores/appShellMachine'
import { apiFetch, post } from './api'
import type { Alert } from './types'

type AppShellActor = Actor<typeof appShellMachine>
type AppShellSend = AppShellActor['send']

export const POLL_MS = 30_000

export function loadAlerts({
  live,
  send,
}: {
  live: { current: boolean }
  send: AppShellSend
}): void {
  if (!live.current) return
  void apiFetch<{ alerts: Alert[] }>('/api/alerts')
    .then((r) => { if (live.current) send({ type: 'SET_ALERTS', alerts: r.alerts }) })
    .catch(() => { if (live.current) send({ type: 'SET_ALERTS_FAIL' }) })
}

/** A hidden tab is not a reader: skip its ticks and catch up when it comes back. */
export function loadAlertsIfVisible(args: {
  live: { current: boolean }
  send: AppShellSend
}): void {
  if (document.visibilityState === 'visible') loadAlerts(args)
}

export async function openAlerts({
  open,
  send,
  actor,
  refresh,
}: {
  open: boolean
  send: AppShellSend
  actor: AppShellActor
  refresh: () => Promise<void>
}): Promise<void> {
  send({ type: open ? 'OPEN_ALERTS' : 'CLOSE_ALERTS' })
  const unread = actor.getSnapshot().context.alerts.filter((a) => !a.read)
  if (open && unread.length > 0) {
    const ids = unread.map((a) => a.id)
    // keep MARK_READ after a failed POST; do not SET_ALERTS_FAIL — session unread cue must survive open
    await post('/api/alerts/read', { ids }).catch(() => {})
    /* the ids stay marked in this session so the gesture that reveals them does not erase them */
    send({ type: 'MARK_READ', ids })
    void refresh()
  }
}
