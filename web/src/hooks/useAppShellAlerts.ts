import { useCallback } from 'react'
import { apiFetch, post } from '../lib/api'
import type { Alert } from '../lib/types'
import type { AppShellContext, AppShellEvent } from '../stores/appShellMachine'

export interface UseAppShellAlertsArgs {
  send: (event: AppShellEvent) => void
  actor: { getSnapshot: () => { context: Pick<AppShellContext, 'alerts'> } }
  refresh: () => void | Promise<void>
}

export function loadAppShellAlerts(
  send: (event: AppShellEvent) => void,
  live: () => boolean,
): void {
  if (!live()) return
  void apiFetch<{ alerts: Alert[] }>('/api/alerts')
    .then((r) => {
      if (live()) send({ type: 'SET_ALERTS', alerts: r.alerts })
    })
    .catch(() => {
      if (live()) send({ type: 'SET_ALERTS_FAIL' })
    })
}

/** Alert IO: GET /api/alerts, mark-read. The composer owns poll, visibility, and the live flag. */
export function useAppShellAlerts({ send, actor, refresh }: UseAppShellAlertsArgs) {
  const loadAlerts = useCallback((live: () => boolean) => loadAppShellAlerts(send, live), [send])

  const onOpenAlerts = useCallback(
    async (next: boolean) => {
      send({ type: next ? 'OPEN_ALERTS' : 'CLOSE_ALERTS' })
      const unread = actor.getSnapshot().context.alerts.filter((a) => !a.read)
      if (next && unread.length > 0) {
        const ids = unread.map((a) => a.id)
        // keep MARK_READ after a failed POST; do not SET_ALERTS_FAIL — session unread cue must survive open
        await post('/api/alerts/read', { ids }).catch(() => {})
        /* the ids stay marked in this session so the gesture that reveals them does not erase them */
        send({ type: 'MARK_READ', ids })
        void refresh()
      }
    },
    [actor, refresh, send],
  )

  return { loadAlerts, onOpenAlerts }
}
