import type { GiftDialogModel } from '../lib/giftDialogModel'

/** Gift shares from your binder to a friend. Its engine supplies all behavior. */
export function GiftDialog({ model }: { model: GiftDialogModel }) {
  if (!model.open || !model.recipientName) return null

  return (
    <div className="pack-overlay" {...model.overlayProps}>
      <div className="pack-modal" {...model.dialogProps}>
        <h3 id="gift-dialog-title">🎁 Gift to {model.recipientName}</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, margin: '4px 0 12px' }}>
          Pick a meme you hold shares in — the transfer is free and instant.
        </p>
        <input
          type="search"
          placeholder="Search your binder…"
          {...model.searchInputProps}
          style={{ width: '100%', marginBottom: 10 }}
        />
        <div className="gift-list">
          {model.showEmpty && (
            <p style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>Nothing to gift here.</p>
          )}
          {model.rows.map((row) => (
            <button
              key={row.id}
              className={`gift-row ${row.selected ? 'picked' : ''}`}
              {...row.buttonProps}
            >
              <img src={row.imageProps.src} alt={row.imageProps.alt} />
              <span className="gift-row-title">{row.title}</span>
              <span className="gift-row-shares">{row.sharesLabel}</span>
            </button>
          ))}
        </div>
        {model.showControls && (
          <div className="filter-bar" style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13.5 }}>
              shares{' '}
              <input
                type="number"
                {...model.sharesInputProps}
                style={{ width: 84 }}
              />{' '}
              <span style={{ color: 'var(--text-dim)' }}>of {model.maxShares}</span>
            </label>
            <button className="primary" {...model.submitButtonProps}>
              {model.submitLabel}
            </button>
          </div>
        )}
        {model.error && <p className="notice error" style={{ marginTop: 10 }}>{model.error}</p>}
      </div>
    </div>
  )
}
