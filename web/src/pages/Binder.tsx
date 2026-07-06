import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { MemeCard } from '../components/MemeCard'
import { useAuth } from '../context/AuthContext'
import type { Meme } from '../lib/types'

export default function Binder() {
  const { user } = useAuth()
  const [memes, setMemes] = useState<Meme[] | null>(null)

  useEffect(() => {
    apiFetch<{ memes: Meme[] }>('/api/binder')
      .then((r) => setMemes(r.memes))
      .catch(() => setMemes([]))
  }, [])

  return (
    <main className="container">
      <div className="page-head">
        <h2>My Binder</h2>
        <div className="filter-bar">
          {user && (
            <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              {user.collectionSize} positions · portfolio 🪙 {user.portfolioValue.toLocaleString()}
            </span>
          )}
          <Link to="/binder/new">
            <button className="primary">＋ Mint a meme</button>
          </Link>
        </div>
      </div>

      {memes === null ? (
        <div className="empty">
          <span className="spin" />
        </div>
      ) : memes.length === 0 ? (
        <div className="empty">
          Your binder is empty. Mint your first meme and start the grind to ✨Shiny✨.
        </div>
      ) : (
        <div className="card-grid">
          {memes.map((m) => (
            <MemeCard
              key={m.id}
              meme={m}
              footer={
                <span className="meme-sub">
                  <span>
                    {m.myShares ?? 0}/100 shares{m.isCreator ? ' · creator' : ''}
                  </span>
                </span>
              }
            />
          ))}
        </div>
      )}
    </main>
  )
}
