import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { MemeCard } from '../components/MemeCard'
import { TIERS } from '../../../shared/tiers'
import type { Meme } from '../lib/types'

export default function Marketplace() {
  const [memes, setMemes] = useState<Meme[] | null>(null)
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [tier, setTier] = useState('')
  const [listed, setListed] = useState(false)
  const [sort, setSort] = useState('new')

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (type) p.set('type', type)
    if (tier) p.set('tier', tier)
    if (listed) p.set('listed', 'true')
    if (sort !== 'new') p.set('sort', sort)
    return p.toString()
  }, [q, type, tier, listed, sort])

  useEffect(() => {
    const t = setTimeout(() => {
      apiFetch<{ memes: Meme[] }>(`/api/memes${query ? `?${query}` : ''}`)
        .then((r) => setMemes(r.memes))
        .catch(() => setMemes([]))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  return (
    <main className="container">
      <div className="page-head">
        <h2>Marketplace</h2>
        <div className="filter-bar">
          <input
            type="search"
            placeholder="Search memes, tags, creators…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All media</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="">All tiers</option>
            {TIERS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Newest</option>
            <option value="viral">Most viral</option>
            <option value="value">Highest value</option>
          </select>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5 }}>
            <input type="checkbox" checked={listed} onChange={(e) => setListed(e.target.checked)} />
            For sale
          </label>
          <Link to="/binder/new">
            <button className="primary">＋ Create meme</button>
          </Link>
        </div>
      </div>

      {memes === null ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : memes.length === 0 ? (
        <div className="empty">No memes match. Be the change — mint one in My Binder.</div>
      ) : (
        <div className="card-grid">
          {memes.map((m) => (
            <MemeCard key={m.id} meme={m} />
          ))}
        </div>
      )}
    </main>
  )
}
