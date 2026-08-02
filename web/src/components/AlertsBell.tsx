import { useEffect, useState } from 'react'
import { AlertsBell as AlertsBellView } from '@memeon/ui'
import { apiFetch, post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Alert } from '../lib/types'

const POLL_MS = 30_000

/** Container: polls the alerts feed and marks unread as read when opened. */
export function AlertsBell() {
  const { user, refresh } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    let live = true
    const load = () =>
      apiFetch<{ alerts: Alert[] }>('/api/alerts')
        .then((r) => live && setAlerts(r.alerts))
        .catch(() => {})
    void load()
    const t = setInterval(load, POLL_MS)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [user])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    const unread = alerts.filter((a) => !a.read)
    if (next && unread.length > 0) {
      // mark as read once viewed
      await post('/api/alerts/read', { ids: unread.map((a) => a.id) }).catch(() => {})
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
      void refresh()
    }
  }

  return (
    <AlertsBellView
      alerts={alerts}
      open={open}
      onToggle={() => void toggle()}
      onDismiss={() => setOpen(false)}
    />
  )
}
