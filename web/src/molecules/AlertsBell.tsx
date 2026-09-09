import { Link } from 'react-router-dom'
import type { AlertsBellModel } from '../lib/alertsBellModel'

/**
 * Alerts popover. Parent owns the list, open state, and mark-as-read.
 * Escape and focus-out dismissal come in through rootProps.
 */
export function AlertsBell({ model }: { model: AlertsBellModel }) {
  return (
    <div className="bell" {...model.rootProps}>
      <button {...model.triggerProps}>
        🔔
        {model.unreadLabel && (
          <span className="bell-badge" {...model.badgeProps}>
            {model.unreadLabel}
          </span>
        )}
      </button>
      {model.open && (
        <div className="alerts-pop" {...model.popoverProps}>
          {model.empty && <div className="alert-row">{model.emptyLabel}</div>}
          {model.rows.map((row) => {
            const className = `alert-row ${row.unread ? 'unread' : ''}`
            // the painted row is the promise, so the row itself is the link: the whole card taps
            const body = (
              <>
                {row.statusLabel && (
                  <>
                    <span className="alert-dot" aria-hidden="true" />
                    <span className="sr-only">{row.statusLabel} </span>
                  </>
                )}
                <span className="alert-row-message">{row.message}</span>
                <time {...row.timeProps}>{row.timeLabel}</time>
              </>
            )
            return row.linkProps ? (
              <Link key={row.id} className={className} {...row.linkProps}>
                {body}
              </Link>
            ) : (
              <div key={row.id} className={className}>
                {body}
              </div>
            )
          })}
          {model.overflowLabel && (
            <div className="alert-row muted">{model.overflowLabel}</div>
          )}
        </div>
      )}
    </div>
  )
}
