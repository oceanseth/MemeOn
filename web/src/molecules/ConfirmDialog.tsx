import type { ConfirmDialogModel } from '../lib/confirmDialogModel'

/**
 * Reusable styled confirmation modal. Render it always; the model controls visibility.
 *
 *   <ConfirmDialog model={confirmDialog} />
 */
export function ConfirmDialog({ model }: { model: ConfirmDialogModel }) {
  if (!model.open) return null
  return (
    <div className="pack-overlay" {...model.overlayProps}>
      <div
        className={`pack-modal confirm-modal ${model.danger ? 'confirm-danger' : ''}`}
        {...model.dialogProps}
      >
        <h3>{model.title}</h3>
        <div className="confirm-message">{model.message}</div>
        <div className="filter-bar" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
          <button {...model.cancelButtonProps}>
            {model.cancelLabel}
          </button>
          <button
            className={model.danger ? 'danger confirm-danger-btn' : 'primary'}
            {...model.confirmButtonProps}
          >
            {model.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
