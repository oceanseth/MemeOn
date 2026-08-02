import { Link } from 'react-router-dom'
import { MemeCard } from './MemeCard'
import { useMemeplexPanel } from './hooks/useMemeplexPanel'
import type { Meme, Memeplex } from './types'

export { parseMemeRef } from './hooks/useMemeplexPanel'

/**
 * The memeplex: this meme's family — remix ancestry, remixes of it, and
 * manually linked relatives. Creators/shareholders can add relatives.
 *
 * Presentational — the host loads `plex` and `linkable` and performs the link
 * in `onLink`.
 *
 * Markup and styling only: visibility, the assembled family and the two link
 * paths live in `useMemeplexPanel`.
 */
export function MemeplexPanel({
  meme,
  plex,
  canEdit,
  linkable = [],
  message = null,
  onLink,
}: {
  meme: Meme
  plex: Memeplex | null
  canEdit: boolean
  /** binder memes not already in the family — offered in the picker */
  linkable?: Meme[]
  message?: string | null
  onLink: (memeId: string) => void
}) {
  const c = useMemeplexPanel({ meme, plex, canEdit, linkable, onLink })

  if (!c.visible) return null

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <strong>🕸️ Memeplex</strong>
      {c.hasAncestors && (
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, margin: '8px 0' }}>
          Descended from{' '}
          {c.ancestorItems.map((a) => (
            <span key={a.id}>
              {a.separator}
              <Link {...a.linkProps}>"{a.title}"</Link>
              {a.isOriginal && ' (the original)'}
            </span>
          ))}
        </p>
      )}

      {c.hasFamily ? (
        <div
          className="card-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', marginTop: 10 }}
        >
          {c.family.map((m) => (
            <MemeCard key={m.id} meme={m} />
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>{c.emptyMessage}</p>
      )}

      {c.canEdit && (
        <div className="filter-bar" style={{ marginTop: 12 }}>
          <select {...c.selectProps}>
            <option value="">Link from your binder…</option>
            {c.options.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          {c.pick && (
            <button className="primary" {...c.linkPickProps}>
              Link
            </button>
          )}
          <input placeholder="…or paste a meme link" style={{ minWidth: 180 }} {...c.pastedProps} />
          {c.canLinkPasted && (
            <button className="primary" {...c.linkPastedProps}>
              Link
            </button>
          )}
        </div>
      )}
      {message && (
        <p className="notice ok" style={{ marginTop: 8 }}>
          {message}
        </p>
      )}
    </div>
  )
}
