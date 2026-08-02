import type { ReactNode } from 'react'
import { useConfirmDialog } from './hooks/useConfirmDialog'

/**
 * Reusable styled confirmation modal. Render it always; control with `open`.
 *
 *   <ConfirmDialog
 *     open={confirming} danger title="Delete forever?"
 *     message="This can't be undone." confirmLabel="Delete it"
 *     onConfirm={...} onCancel={() => setConfirming(false)}
 *   />
 *
 * Markup and styling only: gating, the danger flag and the busy label swap
 * live in `useConfirmDialog`.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const c = useConfirmDialog({
    open,
    confirmLabel,
    cancelLabel,
    danger,
    busy,
    onConfirm,
    onCancel,
  })

  if (!c.isOpen) return null

  return (
    <div className="pack-overlay" {...c.overlayProps}>
      <div
        className={`pack-modal confirm-modal ${c.danger ? 'confirm-danger' : ''}`}
        {...c.modalProps}
      >
        <h3>
          {c.titlePrefix}
          {title}
        </h3>
        <div className="confirm-message">{message}</div>
        <div className="filter-bar" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
          <button {...c.cancelProps}>{c.cancelLabel}</button>
          <button className={c.danger ? 'danger confirm-danger-btn' : 'primary'} {...c.confirmProps}>
            {c.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
