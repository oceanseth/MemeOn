import type { ButtonHTMLAttributes, RefAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'
import type { Alert } from './types'

export interface AlertRowModel {
  id: string
  unread: boolean
  message: string
  linkProps: Pick<LinkProps, 'to' | 'onClick'> | null
  timeLabel: string
}

export interface AlertsBellModel {
  rootProps: RefAttributes<HTMLDivElement>
  triggerProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label' | 'aria-expanded'>
  open: boolean
  empty: boolean
  unreadLabel: string | null
  rows: AlertRowModel[]
}

export function buildAlertsBellModel({
  alerts,
  open,
  onOpenChange,
  rootRef,
}: {
  alerts: Alert[]
  open: boolean
  onOpenChange: (open: boolean) => void
  rootRef?: RefAttributes<HTMLDivElement>['ref']
}): AlertsBellModel {
  const unreadCount = alerts.filter((alert) => !alert.read).length
  const close = () => onOpenChange(false)

  return {
    rootProps: { ref: rootRef },
    triggerProps: {
      onClick: () => onOpenChange(!open),
      'aria-label': 'Alerts',
      'aria-expanded': open,
    },
    open,
    empty: alerts.length === 0,
    unreadLabel: unreadCount > 0 ? String(unreadCount) : null,
    rows: alerts.map((alert) => {
      const to = alert.memeId
        ? `/m/${alert.memeId}`
        : alert.subjectSub
          ? `/u/${encodeURIComponent(alert.subjectSub)}`
          : null
      return {
        id: alert.id,
        unread: !alert.read,
        message: alert.message,
        linkProps: to ? { to, onClick: close } : null,
        timeLabel: new Date(alert.createdAt).toLocaleString(),
      }
    }),
  }
}
