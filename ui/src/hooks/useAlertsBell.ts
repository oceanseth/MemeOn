import { useEffect, useMemo, useRef } from 'react'
import type { Alert } from '../types'

/**
 * Mechanism for the alerts bell: unread count, outside-click dismissal, and
 * the per-row link target (meme, subject, or none). No styling — `read` is
 * exposed as a flag so the caller decides how unread looks.
 */
export function useAlertsBell({
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
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: globalThis.MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onDismiss()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [onDismiss])

  const items = useMemo(
    () =>
      alerts.map((a) => ({
        id: a.id,
        message: a.message,
        read: a.read,
        time: new Date(a.createdAt).toLocaleString(),
        linkProps: a.memeId
          ? { to: `/m/${a.memeId}`, onClick: onDismiss }
          : a.subjectSub
            ? { to: `/u/${encodeURIComponent(a.subjectSub)}`, onClick: onDismiss }
            : null,
      })),
    [alerts, onDismiss],
  )

  return useMemo(
    () => ({
      isOpen: open,
      unreadCount: alerts.filter((a) => !a.read).length,
      isEmpty: alerts.length === 0,
      items,
      emptyMessage: 'No alerts yet — go make noise.',

      wrapProps: { ref: wrapRef },
      triggerProps: { onClick: onToggle, 'aria-label': 'Alerts' },
    }),
    [open, alerts, items, onToggle],
  )
}
