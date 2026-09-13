import type { ButtonHTMLAttributes, HTMLAttributes, TimeHTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'
import { alertsBellCopy as copy } from '../copy/alertsBell'
import type { Alert } from './types'

/** One popover holds a session's worth of alerts; older ones live on the server. */
const MAX_ROWS = 20
const MAX_BADGE = 99

/** Recency is the useful unit in a notification list; the exact stamp stays in the tooltip. */
export function formatWhen(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const deltaMinutes = (then - now) / 60_000
  if (Math.abs(deltaMinutes) < 1) return copy.justNow
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
  /**
   * Base UI's `Popover.Root` contract. Every dismissal it recognises — Escape, an outside press,
   * a focus-out — arrives at `onOpenChange` with `false`; the popover is controlled, so nothing
   * opens or closes until the engine says so.
   */
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * `aria-expanded`, `aria-haspopup` and `aria-controls` come from `Popover.Trigger`, which owns
   * the popup's id. Only the name is ours: a bell glyph names nothing, and the unread count has to
   * reach a screen reader that never sees the badge.
   */
  triggerProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'>
  /** `Popover.Popup` is a `role="dialog"`; without a `Popover.Title` it needs an explicit name. */
  popupProps: Pick<HTMLAttributes<HTMLDivElement>, 'aria-label'>
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
  wasUnread = [],
  failed = false,
  now,
}: {
  alerts: Alert[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Ids that were unread when the popover was opened: reading them must not erase them. */
  wasUnread?: string[]
  failed?: boolean
  now?: number
}): AlertsBellModel {
  const unreadCount = alerts.filter((alert) => !alert.read).length
  const close = () => onOpenChange(false)
  const stillUnread = new Set(wasUnread)

  return {
    open,
    onOpenChange,
    triggerProps: {
      'aria-label': copy.trigger(unreadCount),
    },
    popupProps: { 'aria-label': copy.title },
    empty: alerts.length === 0,
    emptyLabel: failed ? copy.offline : copy.empty,
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
        statusLabel: unread ? copy.unreadRow : null,
        message: alert.message,
        /* a row that navigates has done its job; leaving the popover open over the new route
           would be a second thing to dismiss */
        linkProps: to ? { to, onClick: close } : null,
        timeLabel: formatWhen(alert.createdAt, now),
        timeProps: {
          dateTime: alert.createdAt,
          title: new Date(alert.createdAt).toLocaleString(),
        },
      }
    }),
    overflowLabel:
      alerts.length > MAX_ROWS ? copy.overflow(MAX_ROWS) : null,
  }
}
