import { Link } from 'react-router-dom'
import { useAlertsBell } from './hooks/useAlertsBell'
import type { Alert } from './types'

/**
 * Alerts bell with unread badge and a popover feed. Presentational and
 * controlled — the host owns fetching, polling, and marking-as-read.
 *
 *   <AlertsBell alerts={alerts} open={open}
 *     onToggle={() => setOpen(o => !o)} onDismiss={() => setOpen(false)} />
 *
 * Markup and styling only: unread counting and outside-click dismissal live in
 * `useAlertsBell`.
 */
export function AlertsBell({
  alerts,
  open,
  onToggle,
  onDismiss,
}: {
  alerts: Alert[]
  open: boolean
  onToggle: () => void
  onDismiss: () => void
}) {
  const c = useAlertsBell({ alerts, open, onToggle, onDismiss })

  return (
    <div className="bell" {...c.wrapProps}>
      <button {...c.triggerProps}>
        🔔
        {c.unreadCount > 0 && <span className="bell-badge">{c.unreadCount}</span>}
      </button>
      {c.isOpen && (
        <div className="alerts-pop">
          {c.isEmpty && <div className="alert-row">{c.emptyMessage}</div>}
          {c.items.map((a) => (
            <div key={a.id} className={`alert-row ${a.read ? '' : 'unread'}`}>
              {a.linkProps ? <Link {...a.linkProps}>{a.message}</Link> : a.message}
              <time>{a.time}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
