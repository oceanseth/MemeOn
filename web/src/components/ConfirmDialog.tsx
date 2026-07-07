import type { ReactNode } from 'react'

/**
 * Reusable styled confirmation modal. Render it always; control with `open`.
 *
 *   <ConfirmDialog
 *     open={confirming} danger title="Delete forever?"
 *     message="This can't be undone." confirmLabel="Delete it"
 *     onConfirm={...} onCancel={() => setConfirming(false)}
 *   />
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
  if (!open) return null
  return (
    <div className="pack-overlay" onClick={onCancel}>
      <div
        className={`pack-modal confirm-modal ${danger ? 'confirm-danger' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <h3>{danger ? '⚠️ ' : ''}{title}</h3>
        <div className="confirm-message">{message}</div>
        <div className="filter-bar" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={danger ? 'danger confirm-danger-btn' : 'primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
