import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
import { useAuth } from '../context/AuthContext'
import { MemeCard } from '../components/MemeCard'
import type { Meme } from '../lib/types'

export const INVITE_KEY = 'memeon_invite_from'

interface InviteData {
  inviter: {
    sub: string
    name: string
    picture: string | null
    followers: number
    collectionSize: number
    portfolioValue: number
  }
  topMemes: Meme[]
}

export default function Invite() {
  const { sub } = useParams<{ sub: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<InviteData | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!sub) return
    apiFetch<InviteData>(`/api/invite/${encodeURIComponent(sub)}`)
      .then(setData)
      .catch(() => setErr('This invite link is invalid or expired.'))
  }, [sub])

  const accept = async () => {
    if (!sub) return
    setBusy(true)
    setErr(null)
    try {
      if (user) {
        // already a member: just befriend and go
        await post('/api/invites/accept', { inviterId: sub })
        navigate('/friends')
        return
      }
      sessionStorage.setItem(INVITE_KEY, sub)
      await beginMaskyLogin()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'something went wrong')
      setBusy(false)
    }
  }

  if (err && !data)
    return (
      <main className="container" style={{ paddingTop: 90, textAlign: 'center' }}>
        <p className="notice error">{err}</p>
      </main>
    )

  if (!data)
    return (
      <main className="container" style={{ paddingTop: 90, textAlign: 'center' }}>
        <span className="spin" />
      </main>
    )

  const { inviter, topMemes } = data
  const isSelf = user?.sub === inviter.sub

  return (
    <main className="container">
      <section className="hero" style={{ paddingBottom: 24 }}>
        {inviter.picture && (
          <img
            src={inviter.picture}
            alt={inviter.name}
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              border: '3px solid var(--accent)',
              objectFit: 'cover',
            }}
          />
        )}
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 44px)' }}>
          <span className="grad">{inviter.name}</span> invited you to MemeOn
        </h1>
        <p>
          📚 {inviter.collectionSize} memes collected · 🪙 {inviter.portfolioValue.toLocaleString()}{' '}
          portfolio · ⭐ {inviter.followers} followers
        </p>
        <p>
          MemeOn turns memes into trading cards. Mint them, watch them climb foil rarity tiers as
          their share links spread, and invest in your friends' bangers before they go ✨Shiny✨.
        </p>
        {isSelf ? (
          <p className="notice ok">This is your own invite link — send it to a friend!</p>
        ) : (
          <button className="primary login-btn" onClick={accept} disabled={busy}>
            {busy ? 'Opening Masky…' : user ? `🤝 Accept & befriend ${inviter.name}` : '🎭 Accept invite — join with Masky'}
          </button>
        )}
        {err && <p className="notice error">{err}</p>}
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Joining creates your account with Masky single sign-on and instantly makes you and{' '}
          {inviter.name} friends.
        </p>
      </section>

      {topMemes.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 10 }}>
            {inviter.name}'s binder highlights
          </h2>
          <div className="card-grid">
            {topMemes.map((m) => (
              <MemeCard key={m.id} meme={m} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
