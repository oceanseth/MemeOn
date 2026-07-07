import { useEffect, useMemo, useState } from 'react'
import { apiFetch, post } from '../lib/api'
import type { Meme } from '../lib/types'

/** Gift shares from your binder to a friend: search → pick → choose amount. */
export function GiftDialog({
  open,
  recipient,
  onClose,
  onGifted,
}: {
  open: boolean
  recipient: { sub: string; name: string } | null
  onClose: () => void
  onGifted: (msg: string) => void
}) {
  const [binder, setBinder] = useState<Meme[]>([])
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Meme | null>(null)
  const [shares, setShares] = useState(1)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPick(null)
    setQ('')
    setShares(1)
    setErr(null)
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((r) => setBinder(r.memes.filter((m) => (m.myShares ?? 0) > 0)))
      .catch(() => setBinder([]))
  }, [open])

  const matches = useMemo(
    () => binder.filter((m) => !q.trim() || m.title.toLowerCase().includes(q.toLowerCase())),
    [binder, q],
  )

  if (!open || !recipient) return null

  const maxShares = pick?.myShares ?? 0

  const send = async () => {
    if (!pick) return
    setBusy(true)
    setErr(null)
    try {
      await post('/api/gift', { memeId: pick.id, toSub: recipient.sub, shares })
      onGifted(`🎁 Gifted ${shares} share${shares === 1 ? '' : 's'} of "${pick.title}" to ${recipient.name}`)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'gift failed')
    } finally {
      setBusy(false)
    }
  }

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
          value={q}
          onChange={(e) => setQ(e.target.value)}
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
              onClick={() => {
                setPick(m)
                setShares((s) => Math.min(s, m.myShares ?? 1))
              }}
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
                  setShares(Math.max(1, Math.min(maxShares, Math.floor(Number(e.target.value) || 1))))
                }
                style={{ width: 84 }}
              />{' '}
              <span style={{ color: 'var(--text-dim)' }}>of {maxShares}</span>
            </label>
            <button className="primary" onClick={send} disabled={busy}>
              {busy ? 'Gifting…' : `Gift ${shares} of "${pick.title}"`}
            </button>
          </div>
        )}
        {err && <p className="notice error" style={{ marginTop: 10 }}>{err}</p>}
      </div>
    </div>
  )
}
