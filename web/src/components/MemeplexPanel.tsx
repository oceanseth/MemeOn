import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { MemeCard } from './MemeCard'
import type { Meme, Memeplex } from '../lib/types'

/** Extract a meme id from a raw id or a pasted /m/ | /meme/ URL. */
function parseMemeRef(raw: string): string {
  const t = raw.trim()
  const m = t.match(/\/(?:m|meme)\/([^/?#]+)/)
  return m ? decodeURIComponent(m[1]) : t
}

/**
 * The memeplex: this meme's family — remix ancestry, remixes of it, and
 * manually linked relatives. Creators/shareholders can add relatives.
 */
export function MemeplexPanel({ meme, canEdit }: { meme: Meme; canEdit: boolean }) {
  const [plex, setPlex] = useState<Memeplex | null>(null)
  const [binder, setBinder] = useState<Meme[]>([])
  const [pick, setPick] = useState('')
  const [pasted, setPasted] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(() => {
    apiFetch<Memeplex>(`/api/memes/${meme.id}/memeplex`)
      .then(setPlex)
      .catch(() => {})
  }, [meme.id])

  useEffect(load, [load])

  useEffect(() => {
    if (!canEdit) return
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((r) => setBinder(r.memes.filter((m) => m.id !== meme.id)))
      .catch(() => {})
  }, [canEdit, meme.id])

  const add = async (memeId: string) => {
    setMsg(null)
    try {
      await post(`/api/memes/${meme.id}/memeplex`, { memeId })
      setMsg('Added to the memeplex 🕸️')
      setPick('')
      setPasted('')
      load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'failed to add')
    }
  }

  if (!plex) return null
  const family = [...plex.remixes, ...plex.related]
  if (family.length === 0 && plex.ancestors.length === 0 && !canEdit) return null

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <strong>🕸️ Memeplex</strong>
      {plex.ancestors.length > 0 && (
        <p style={{ color: 'var(--text-dim)', fontSize: 13.5, margin: '8px 0' }}>
          Descended from{' '}
          {plex.ancestors.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ' → '}
              <Link to={`/meme/${a.id}`}>"{a.title}"</Link>
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
          <select value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Link from your binder…</option>
            {binder.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          {pick && <button className="primary" onClick={() => add(pick)}>Link</button>}
          <input
            placeholder="…or paste a meme link"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            style={{ minWidth: 180 }}
          />
          {pasted.trim() && (
            <button className="primary" onClick={() => add(parseMemeRef(pasted))}>
              Link
            </button>
          )}
        </div>
      )}
      {msg && <p className="notice ok" style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  )
}
