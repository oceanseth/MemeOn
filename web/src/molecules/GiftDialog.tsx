import type { GiftDialogModel } from '../lib/giftDialogModel'

/**
 * Gift shares from your binder to a friend, on a native `<dialog>` so focus containment, Escape,
 * the top layer and focus restoration come from the platform. Its engine supplies all behavior,
 * including the in-flight lockdown: while the transfer runs every control here is disabled, not
 * live-but-inert.
 */
const openModal = (node: HTMLDialogElement | null): void => {
  if (!node || node.open || typeof node.showModal !== 'function') return
  node.showModal()
  // showModal() parks focus on the first tab stop (the ✕); the binder search is the actual task
  node.querySelector<HTMLElement>('.gift-dialog-search')?.focus()
}
const closeModal = (node: HTMLDialogElement | null): void => {
  if (node?.open) node.close()
}

export function GiftDialog({ model }: { model: GiftDialogModel }) {
  return (
    <dialog
      ref={model.open ? openModal : closeModal}
      className="pack-modal"
      {...model.dialogProps}
    >
      <div className="dialog-head">
        <h3 id={model.titleId}>{model.title}</h3>
        <button className="modal-close" {...model.closeButtonProps}>
          ✕
        </button>
      </div>
      <p className="gift-dialog-hint">{model.hint}</p>
      <input type="search" className="gift-dialog-search" placeholder="Search your binder…" {...model.searchInputProps} />
      <div className="gift-list">
        {model.showEmpty && <p className="muted">{model.emptyMessage}</p>}
        {model.rows.map((row) => (
          <button
            key={row.id}
            className={`gift-row ${row.selected ? 'picked' : ''}`}
            {...row.buttonProps}
          >
            <span className={row.thumbClassName}>
              <img {...row.imageProps} />
            </span>
            <span className="gift-row-title">{row.title}</span>
            <span className="gift-row-shares">{row.sharesLabel}</span>
            <span className="tier-chip" style={{ color: row.tierColor }}>
              {row.tierLabel}
            </span>
            {row.listed && <span className="badge">{row.listedLabel}</span>}
          </button>
        ))}
      </div>
      <div className="filter-bar gift-dialog-actions">
        {model.showControls && (
          <label className="gift-dialog-shares-label">
            {model.sharesLabel}{' '}
            <input type="number" className="gift-dialog-shares" {...model.sharesInputProps} />{' '}
            <span className="muted">{model.sharesMaxLabel}</span>
          </label>
        )}
        <span className="spacer" />
        <button {...model.cancelButtonProps}>{model.cancelLabel}</button>
        {model.showControls && (
          <button className="primary" {...model.submitButtonProps}>
            {model.submitLabel}
          </button>
        )}
      </div>
      <div role="alert">
        {model.error && <p className="notice error">{model.error}</p>}
      </div>
    </dialog>
  )
}
