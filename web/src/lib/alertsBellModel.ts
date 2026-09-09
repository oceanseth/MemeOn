import type {
  ButtonHTMLAttributes,
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  RefAttributes,
  TimeHTMLAttributes,
} from 'react'
import type { LinkProps } from 'react-router-dom'
import type { Alert } from './types'

/** One popover holds a session's worth of alerts; older ones live on the server. */
const MAX_ROWS = 20
const MAX_BADGE = 99
const POPOVER_ID = 'alerts-pop'

/** Recency is the useful unit in a notification list; the exact stamp stays in the tooltip. */
export function formatWhen(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const deltaMinutes = (then - now) / 60_000
  if (Math.abs(deltaMinutes) < 1) return 'just now'
  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (Math.abs(deltaMinutes) < 60) return relative.format(Math.round(deltaMinutes), 'minute')
  if (Math.abs(deltaMinutes) < 60 * 24) return relative.format(Math.round(deltaMinutes / 60), 'hour')
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(then)
}

export interface AlertRowModel {
  id: string
  unread: boolean
  /** Non-colour cue for an unread row, announced beside the message. */
  statusLabel: string | null
  message: string
  linkProps: Pick<LinkProps, 'to' | 'onClick'> | null
  timeLabel: string
  timeProps: Pick<TimeHTMLAttributes<HTMLTimeElement>, 'dateTime' | 'title'>
}

export interface AlertsBellModel {
  rootProps: RefAttributes<HTMLDivElement> &
    Pick<HTMLAttributes<HTMLDivElement>, 'onKeyDown' | 'onBlur'>
  triggerProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'aria-label' | 'aria-expanded' | 'aria-haspopup' | 'aria-controls'
  >
  popoverProps: Pick<HTMLAttributes<HTMLDivElement>, 'id' | 'role' | 'aria-label'>
  open: boolean
  empty: boolean
  emptyLabel: string
  unreadLabel: string | null
  badgeProps: Pick<HTMLAttributes<HTMLSpanElement>, 'aria-hidden'>
  rows: AlertRowModel[]
  overflowLabel: string | null
}

export function buildAlertsBellModel({
  alerts,
  open,
  onOpenChange,
  rootRef,
  wasUnread = [],
  failed = false,
  now,
}: {
  alerts: Alert[]
  open: boolean
  onOpenChange: (open: boolean) => void
  rootRef?: RefAttributes<HTMLDivElement>['ref']
  /** Ids that were unread when the popover was opened: reading them must not erase them. */
  wasUnread?: string[]
  failed?: boolean
  now?: number
}): AlertsBellModel {
  const unreadCount = alerts.filter((alert) => !alert.read).length
  const close = () => onOpenChange(false)
  const stillUnread = new Set(wasUnread)

  return {
    rootProps: {
      ref: rootRef,
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
        if (!open || event.key !== 'Escape') return
        event.stopPropagation()
        close()
        event.currentTarget.querySelector('button')?.focus()
      },
      onBlur: (event: FocusEvent<HTMLDivElement>) => {
        if (!open) return
        if (event.currentTarget.contains(event.relatedTarget)) return
        close()
      },
    },
    triggerProps: {
      onClick: () => onOpenChange(!open),
      'aria-label': unreadCount > 0 ? `Alerts, ${unreadCount} unread` : 'Alerts',
      'aria-expanded': open,
      'aria-haspopup': 'true',
      'aria-controls': POPOVER_ID,
    },
    popoverProps: { id: POPOVER_ID, role: 'group', 'aria-label': 'Alerts' },
    open,
    empty: alerts.length === 0,
    emptyLabel: failed
      ? "Alerts are offline — we'll retry in a moment."
      : 'No alerts yet — go make noise.',
    unreadLabel: unreadCount > 0 ? (unreadCount > MAX_BADGE ? `${MAX_BADGE}+` : String(unreadCount)) : null,
    badgeProps: { 'aria-hidden': true },
    rows: alerts.slice(0, MAX_ROWS).map((alert) => {
      const to = alert.memeId
        ? `/m/${alert.memeId}`
        : alert.subjectSub
          ? `/u/${encodeURIComponent(alert.subjectSub)}`
          : null
      const unread = !alert.read || stillUnread.has(alert.id)
      return {
        id: alert.id,
        unread,
        statusLabel: unread ? 'Unread.' : null,
        message: alert.message,
        linkProps: to ? { to, onClick: close } : null,
        timeLabel: formatWhen(alert.createdAt, now),
        timeProps: {
          dateTime: alert.createdAt,
          title: new Date(alert.createdAt).toLocaleString(),
        },
      }
    }),
    overflowLabel:
      alerts.length > MAX_ROWS ? `Showing your ${MAX_ROWS} most recent alerts.` : null,
  }
}
