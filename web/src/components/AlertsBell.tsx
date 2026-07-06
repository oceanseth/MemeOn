import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Alert } from '../lib/types'

const POLL_MS = 30_000

export function AlertsBell() {
  const { user, refresh } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unread = alerts.filter((a) => !a.read)

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && unread.length > 0) {
      // mark as read once viewed
      await post('/api/alerts/read', { ids: unread.map((a) => a.id) }).catch(() => {})
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
      void refresh()
    }
  }

  return (
    <div className="bell" ref={wrapRef}>
      <button onClick={toggle} aria-label="Alerts">
        🔔
        {unread.length > 0 && <span className="bell-badge">{unread.length}</span>}
      </button>
      {open && (
        <div className="alerts-pop">
          {alerts.length === 0 && <div className="alert-row">No alerts yet — go make noise.</div>}
          {alerts.map((a) => (
            <div key={a.id} className={`alert-row ${a.read ? '' : 'unread'}`}>
              {a.memeId ? (
                <Link to={`/meme/${a.memeId}`} onClick={() => setOpen(false)}>
                  {a.message}
                </Link>
              ) : (
                a.message
              )}
              <time>{new Date(a.createdAt).toLocaleString()}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
