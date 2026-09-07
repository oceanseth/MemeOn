import { Link } from 'react-router-dom'
import { MemeCard } from '../atoms/MemeCard'
import type { Meme, Memeplex } from '../lib/types'

/** Extract a meme id from a raw id or a pasted /m/ | /meme/ URL. */
export function parseMemeRef(raw: string): string {
  const t = raw.trim()
  const m = t.match(/\/(?:m|meme)\/([^/?#]+)/)
  return m ? decodeURIComponent(m[1]) : t
}

/**
 * The memeplex: this meme's family — remix ancestry, remixes of it, and
 * manually linked relatives. Parent owns plex, binder, and add.
 */
export function MemeplexPanel({
  meme,
  plex,
  canEdit,
  binder,
  pick,
  onPickChange,
  pasted,
  onPastedChange,
  notice,
  onAdd,
}: {
  meme: Meme
  plex: Memeplex | null
  canEdit: boolean
  binder: Meme[]
  pick: string
  onPickChange: (id: string) => void
  pasted: string
  onPastedChange: (raw: string) => void
  notice: string | null
  onAdd: (memeId: string) => void
}) {
  if (!plex) return null
  const family = [...plex.remixes, ...plex.related]
  if (family.length === 0 && plex.ancestors.length === 0 && !canEdit) return null

  const alreadyLinked = new Set([
    meme.id,
    ...plex.ancestors.map((m) => m.id),
    ...plex.remixes.map((m) => m.id),
    ...plex.related.map((m) => m.id),
  ])
  const linkable = binder.filter((m) => !alreadyLinked.has(m.id))

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <strong>🕸️ Memeplex</strong>
      {plex.ancestors.length > 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, margin: '8px 0' }}>
          Descended from{' '}
          {plex.ancestors.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ' → '}
              <Link to={`/m/${a.id}`}>"{a.title}"</Link>
            </span>
          ))}
          {plex.original && plex.ancestors[0]?.id === plex.original.id && ' (the original)'}
        </p>
      )}

      {family.length > 0 ? (
        <div
          className="card-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', marginTop: 10 }}
        >
          {family.map((m) => (
            <MemeCard key={m.id} meme={m} />
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>
          No relatives yet — remix this meme or link related ones.
        </p>
      )}

      {canEdit && (
        <div className="filter-bar" style={{ marginTop: 12 }}>
          <select value={pick} onChange={(e) => onPickChange(e.target.value)}>
            <option value="">Link from your binder…</option>
            {linkable.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          {pick && (
            <button className="primary" onClick={() => onAdd(pick)}>
              Link
            </button>
          )}
          <input
            placeholder="…or paste a meme link"
            value={pasted}
            onChange={(e) => onPastedChange(e.target.value)}
            style={{ minWidth: 180 }}
          />
          {pasted.trim() && (
            <button className="primary" onClick={() => onAdd(parseMemeRef(pasted))}>
              Link
            </button>
          )}
        </div>
      )}
      {notice && (
        <p className="notice ok" style={{ marginTop: 8 }}>
          {notice}
        </p>
      )}
    </div>
  )
}
