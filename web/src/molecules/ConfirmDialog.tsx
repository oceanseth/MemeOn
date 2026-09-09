import type { ConfirmDialogModel } from '../lib/confirmDialogModel'

/**
 * Reusable styled confirmation modal on a native `<dialog>`, so focus containment, the top layer,
 * Escape and focus restoration come from the platform. Render it always; the model controls
 * visibility — swapping the ref callback is what opens and closes it.
 *
 *   <ConfirmDialog model={confirmDialog} />
 */
const openModal = (node: HTMLDialogElement | null): void => {
  if (node && !node.open && typeof node.showModal === 'function') node.showModal()
}
const closeModal = (node: HTMLDialogElement | null): void => {
  if (node?.open) node.close()
}

export function ConfirmDialog({ model }: { model: ConfirmDialogModel }) {
  return (
    <dialog
      ref={model.open ? openModal : closeModal}
      className={`pack-modal confirm-modal ${model.danger ? 'confirm-danger' : ''}`}
      {...model.dialogProps}
    >
      <h3 id={model.titleId}>{model.title}</h3>
      <div className="confirm-message" id={model.messageId}>{model.message}</div>
      {model.prompt && (
        <label className="field-label">
          {model.prompt.label}
          <textarea {...model.prompt.textareaProps} />
          {model.prompt.hint && <span className="field-hint" id={model.prompt.hintId}>{model.prompt.hint}</span>}
        </label>
      )}
      <div className="filter-bar" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
        <button {...model.cancelButtonProps}>
          {model.cancelLabel}
        </button>
        <button
          className={model.danger ? 'confirm-danger-btn' : 'primary'}
          {...model.confirmButtonProps}
        >
          {model.busy && <span className="spin" aria-hidden="true" />}
          {model.confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
