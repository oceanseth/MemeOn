import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { post } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

export const DISCORD_LINK_KEY = 'memeon_discord_link_token'

/** Landing for /memeon-connect: binds the Discord user to this MemeOn account. */
export default function DiscordLink() {
  const [params] = useSearchParams()
  const { user, loading } = useAuth()
  const [state, setState] = useState<'working' | 'done' | 'error'>('working')
  const [err, setErr] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (loading || ran.current) return
    const token = params.get('token') ?? sessionStorage.getItem(DISCORD_LINK_KEY)
    if (!token) {
      setErr('missing link token — run /memeon-connect in Discord again')
      setState('error')
      return
    }
    if (!user) {
      // stash through the OAuth round-trip, then this page re-runs post-login
      sessionStorage.setItem(DISCORD_LINK_KEY, token)
      sessionStorage.setItem('memeon_post_login', '/discord/link')
      void beginMaskyLogin().catch(() => {
        setErr('login failed — try again')
        setState('error')
      })
      return
    }
    ran.current = true
    sessionStorage.removeItem(DISCORD_LINK_KEY)
    post('/api/discord/link', { token })
      .then(() => setState('done'))
      .catch((e) => {
        setErr(e instanceof Error ? e.message : 'linking failed')
        setState('error')
      })
  }, [loading, user, params])

  return (
    <main className="container" style={{ paddingTop: 90, textAlign: 'center' }}>
      {state === 'working' && (
        <>
          <span className="spin" />
          <p style={{ color: 'var(--text-dim)' }}>Connecting your Discord…</p>
        </>
      )}
      {state === 'done' && (
        <>
          <h2>🎮 Connected!</h2>
          <p style={{ color: 'var(--text-dim)' }}>
            Head back to Discord — <code>/memeon</code> now ranks your binder 💼 and friends' memes
            🤝 first.
          </p>
        </>
      )}
      {state === 'error' && <p className="notice error">{err}</p>}
    </main>
  )
}
