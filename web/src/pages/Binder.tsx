import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { MemeCard } from '../components/MemeCard'
import { useAuth } from '../context/AuthContext'
import type { Meme } from '../lib/types'

export default function Binder() {
  const { user } = useAuth()
  const [memes, setMemes] = useState<Meme[] | null>(null)
  const [showPrivate, setShowPrivate] = useState(false)

  useEffect(() => {
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((r) => setMemes(r.memes))
      .catch(() => setMemes([]))
  }, [])

  const visible = (memes ?? []).filter((m) => showPrivate || !m.private)
  const privateCount = (memes ?? []).filter((m) => m.private).length

  return (
    <main className="container">
      <div className="page-head">
        <h2>My Binder</h2>
        <div className="filter-bar">
          {user && (
            <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              {user.collectionSize} positions · portfolio 🧠 {user.portfolioValue.toLocaleString()}
            </span>
          )}
          {privateCount > 0 && (
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5 }}>
              <input
                type="checkbox"
                checked={showPrivate}
                onChange={(e) => setShowPrivate(e.target.checked)}
              />
              Show private ({privateCount})
            </label>
          )}
          <Link to="/binder/new">
            <button className="primary">＋ Create meme</button>
          </Link>
        </div>
      </div>

      {memes === null ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          {memes.length === 0
            ? 'Your binder is empty. Mint your first meme and start the grind to ✨Shiny✨.'
            : 'Everything here is private — tick "Show private" to see it.'}
        </div>
      ) : (
        <div className="card-grid">
          {visible.map((m) => (
            <MemeCard
              key={m.id}
              meme={m}
              footer={
                <span className="meme-sub">
                  <span>
                    {m.myShares ?? 0}/100 shares{m.isCreator ? ' · creator' : ''}
                  </span>
                  {m.private && <span className="badge">🙈 private</span>}
                </span>
              }
            />
          ))}
        </div>
      )}
    </main>
  )
}
