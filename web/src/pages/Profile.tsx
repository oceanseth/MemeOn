import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { MemeCard } from '../components/MemeCard'
import type { Meme } from '../lib/types'

interface ProfileData {
  profile: {
    sub: string
    name: string
    picture: string | null
    followers: number
    collectionSize: number
    portfolioValue: number
  }
  followingByMe: boolean
  friendStatus: 'incoming' | 'outgoing' | 'accepted' | null
  created: Meme[]
  binder: (Meme & { shares: number })[]
}

export default function Profile() {
  const { sub } = useParams<{ sub: string }>()
  const { user } = useAuth()
  const [data, setData] = useState<ProfileData | null>(null)
  const [tab, setTab] = useState<'created' | 'binder'>('created')
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!sub) return
    apiFetch<ProfileData>(`/api/users/${encodeURIComponent(sub)}/profile`)
      .then(setData)
      .catch(() => setErr('profile not found'))
  }, [sub])

  useEffect(load, [load])

  if (err)
    return (
      <main className="container">
        <div className="empty" style={{ marginTop: 60 }}>{err}</div>
      </main>
    )
  if (!data)
    return (
      <main className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
        <span className="spin" />
      </main>
    )

  const { profile, followingByMe, friendStatus } = data
  const isSelf = user?.sub === profile.sub
  const memes: (Meme & { shares?: number })[] = tab === 'created' ? data.created : data.binder

  const toggleFollow = async () => {
    await post(`/api/users/${encodeURIComponent(profile.sub)}/${followingByMe ? 'unfollow' : 'follow'}`, {}).catch(() => {})
    load()
  }

  const friendAction = async () => {
    if (friendStatus === null) await post('/api/friends/request', { userId: profile.sub }).catch(() => {})
    else if (friendStatus === 'incoming')
      await post('/api/friends/respond', { userId: profile.sub, accept: true }).catch(() => {})
    load()
  }

  const friendLabel =
    friendStatus === 'accepted'
      ? '🤝 Friends'
      : friendStatus === 'outgoing'
        ? '⏳ Requested'
        : friendStatus === 'incoming'
          ? '✅ Accept request'
          : '👋 Add friend'

  return (
    <main className="container">
      <section className="hero" style={{ paddingTop: 44, paddingBottom: 20 }}>
        {profile.picture && (
          <img
            src={profile.picture}
            alt={profile.name}
            style={{ width: 96, height: 96, borderRadius: '50%', border: '3px solid var(--accent)', objectFit: 'cover' }}
          />
        )}
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 38px)', margin: '10px 0 4px' }}>{profile.name}</h1>
        <p style={{ margin: 0 }}>
          ⭐ {profile.followers} followers · 📚 {profile.collectionSize} memes · portfolio 🧠{' '}
          {profile.portfolioValue.toLocaleString()}
        </p>
        {!isSelf && user && (
          <div className="filter-bar" style={{ justifyContent: 'center', marginTop: 16 }}>
            <button className={followingByMe ? '' : 'primary'} onClick={toggleFollow}>
              {followingByMe ? '★ Following' : '☆ Follow'}
            </button>
            <button
              onClick={friendAction}
              disabled={friendStatus === 'accepted' || friendStatus === 'outgoing'}
            >
              {friendLabel}
            </button>
          </div>
        )}
      </section>

      <div className="filter-bar" style={{ marginBottom: 18 }}>
        <button className={tab === 'created' ? 'primary' : ''} onClick={() => setTab('created')}>
          Created ({data.created.length})
        </button>
        <button className={tab === 'binder' ? 'primary' : ''} onClick={() => setTab('binder')}>
          Binder ({data.binder.length})
        </button>
      </div>

      {memes.length === 0 ? (
        <div className="empty">Nothing here yet.</div>
      ) : (
        <div className="card-grid">
          {memes.map((m) => (
            <MemeCard
              key={`${tab}-${m.id}`}
              meme={m}
              footer={
                m.shares !== undefined ? (
                  <span className="meme-sub">
                    <span>{m.shares}/100 shares</span>
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </main>
  )
}
