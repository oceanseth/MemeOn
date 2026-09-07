import type { Meme } from '../lib/types'

export type GiftRecipient = { sub: string; name: string }

/**
 * Gift shares from your binder to a friend: search → pick → choose amount.
 * Parent owns binder results, query, pick, submit.
 */
export function GiftDialog({
  open,
  recipient,
  memes,
  query,
  onQueryChange,
  pick,
  onPick,
  shares,
  onSharesChange,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean
  recipient: GiftRecipient | null
  memes: Meme[]
  query: string
  onQueryChange: (q: string) => void
  pick: Meme | null
  onPick: (meme: Meme) => void
  shares: number
  onSharesChange: (n: number) => void
  busy: boolean
  error: string | null
  onClose: () => void
  onSubmit: () => void
}) {
  if (!open || !recipient) return null

  const matches = memes.filter(
    (m) => !query.trim() || m.title.toLowerCase().includes(query.toLowerCase()),
  )
  const maxShares = pick?.myShares ?? 0

  return (
    <div className="pack-overlay" onClick={onClose}>
      <div className="pack-modal" onClick={(e) => e.stopPropagation()}>
        <h3>🎁 Gift to {recipient.name}</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, margin: '4px 0 12px' }}>
          Pick a meme you hold shares in — the transfer is free and instant.
        </p>
        <input
          type="search"
          placeholder="Search your binder…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />
        <div className="gift-list">
          {matches.length === 0 && (
            <p style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>Nothing to gift here.</p>
          )}
          {matches.map((m) => (
            <button
              key={m.id}
              className={`gift-row ${pick?.id === m.id ? 'picked' : ''}`}
              onClick={() => onPick(m)}
            >
              <img src={m.imageUrl} alt="" />
              <span className="gift-row-title">{m.title}</span>
              <span className="gift-row-shares">{m.myShares}/100</span>
            </button>
          ))}
        </div>
        {pick && (
          <div className="filter-bar" style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13.5 }}>
              shares{' '}
              <input
                type="number"
                min={1}
                max={maxShares}
                value={shares}
                onChange={(e) =>
                  onSharesChange(Math.max(1, Math.min(maxShares, Math.floor(Number(e.target.value) || 1))))
                }
                style={{ width: 84 }}
              />{' '}
              <span style={{ color: 'var(--text-dim)' }}>of {maxShares}</span>
            </label>
            <button className="primary" onClick={onSubmit} disabled={busy}>
              {busy ? 'Gifting…' : `Gift ${shares} of "${pick.title}"`}
            </button>
          </div>
        )}
        {error && <p className="notice error" style={{ marginTop: 10 }}>{error}</p>}
      </div>
    </div>
  )
}
