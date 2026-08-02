import { useGiftDialog } from './hooks/useGiftDialog'
import type { Meme } from './types'

/**
 * Gift shares from your binder to a friend: search → pick → choose amount.
 *
 * Presentational — the host supplies the giftable memes and performs the
 * transfer in `onGift`.
 *
 * Markup and styling only: search, selection and share clamping live in
 * `useGiftDialog`.
 */
export function GiftDialog({
  open,
  recipient,
  memes,
  busy = false,
  error = null,
  onClose,
  onGift,
}: {
  open: boolean
  recipient: { sub: string; name: string } | null
  /** memes the sender holds shares in */
  memes: Meme[]
  busy?: boolean
  error?: string | null
  onClose: () => void
  onGift: (memeId: string, shares: number) => void
}) {
  const c = useGiftDialog({ open, recipient, memes, busy, onClose, onGift })

  if (!c.isOpen) return null

  return (
    <div className="pack-overlay" {...c.overlayProps}>
      <div className="pack-modal" {...c.modalProps}>
        <h3>🎁 Gift to {c.recipientName}</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, margin: '4px 0 12px' }}>
          Pick a meme you hold shares in — the transfer is free and instant.
        </p>
        <input
          type="search"
          placeholder="Search your binder…"
          style={{ width: '100%', marginBottom: 10 }}
          {...c.searchProps}
        />
        <div className="gift-list">
          {c.isEmpty && (
            <p style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>Nothing to gift here.</p>
          )}
          {c.rows.map((row) => (
            <button
              key={row.id}
              className={`gift-row ${row.picked ? 'picked' : ''}`}
              {...row.buttonProps}
            >
              <img {...row.thumbProps} />
              <span className="gift-row-title">{row.title}</span>
              <span className="gift-row-shares">{row.sharesLabel}</span>
            </button>
          ))}
        </div>
        {c.hasPick && (
          <div className="filter-bar" style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13.5 }}>
              shares <input type="number" style={{ width: 84 }} {...c.sharesInputProps} />{' '}
              <span style={{ color: 'var(--text-dim)' }}>of {c.maxShares}</span>
            </label>
            <button className="primary" {...c.submitProps}>
              {c.submitLabel}
            </button>
          </div>
        )}
        {error && (
          <p className="notice error" style={{ marginTop: 10 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
