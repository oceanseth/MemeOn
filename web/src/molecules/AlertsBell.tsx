import { Link } from 'react-router-dom'
import type { AlertsBellModel } from '../lib/alertsBellModel'

/**
 * Alerts popover. Parent owns the list, open state, and mark-as-read.
 */
export function AlertsBell({ model }: { model: AlertsBellModel }) {
  return (
    <div className="bell" {...model.rootProps}>
      <button {...model.triggerProps}>
        🔔
        {model.unreadLabel && <span className="bell-badge">{model.unreadLabel}</span>}
      </button>
      {model.open && (
        <div className="alerts-pop">
          {model.empty && <div className="alert-row">No alerts yet — go make noise.</div>}
          {model.rows.map((row) => (
            <div key={row.id} className={`alert-row ${row.unread ? 'unread' : ''}`}>
              {row.linkProps ? (
                <Link {...row.linkProps}>
                  {row.message}
                </Link>
              ) : (
                row.message
              )}
              <time>{row.timeLabel}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
