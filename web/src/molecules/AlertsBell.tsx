import type { Ref } from 'react'
import { Link } from 'react-router-dom'
import type { Alert } from '../lib/types'

/**
 * Alerts popover. Parent owns the list, open state, and mark-as-read.
 */
export function AlertsBell({
  alerts,
  open,
  onOpenChange,
  rootRef,
}: {
  alerts: Alert[]
  open: boolean
  onOpenChange: (open: boolean) => void
  rootRef?: Ref<HTMLDivElement> | undefined
}) {
  const unread = alerts.filter((a) => !a.read)

  return (
    <div className="bell" ref={rootRef}>
      <button onClick={() => onOpenChange(!open)} aria-label="Alerts">
        🔔
        {unread.length > 0 && <span className="bell-badge">{unread.length}</span>}
      </button>
      {open && (
        <div className="alerts-pop">
          {alerts.length === 0 && <div className="alert-row">No alerts yet — go make noise.</div>}
          {alerts.map((a) => (
            <div key={a.id} className={`alert-row ${a.read ? '' : 'unread'}`}>
              {a.memeId ? (
                <Link to={`/m/${a.memeId}`} onClick={() => onOpenChange(false)}>
                  {a.message}
                </Link>
              ) : a.subjectSub ? (
                <Link to={`/u/${encodeURIComponent(a.subjectSub)}`} onClick={() => onOpenChange(false)}>
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
