import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { completeMaskyLogin } from '../lib/auth'
import { post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { INVITE_KEY } from './Invite'

export default function AuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [err, setErr] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // StrictMode double-mount; codes are single-use
    ran.current = true
    const code = params.get('code')
    if (!code) {
      setErr(params.get('error') ?? 'missing authorization code')
      return
    }
    completeMaskyLogin(code, params.get('state'))
      .then(async () => {
        // finish an invite if this login started from an invite link
        const inviterId = sessionStorage.getItem(INVITE_KEY)
        sessionStorage.removeItem(INVITE_KEY)
        if (inviterId) {
          await post('/api/invites/accept', { inviterId }).catch(() => {})
        }
        await refresh()
        navigate(inviterId ? '/friends' : '/marketplace', { replace: true })
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'login failed'))
  }, [params, navigate, refresh])

  return (
    <main className="container" style={{ paddingTop: 90, textAlign: 'center' }}>
      {err ? (
        <>
          <p className="notice error">{err}</p>
          <button onClick={() => navigate('/')}>Back home</button>
        </>
      ) : (
        <>
          <span className="spin" />
          <p style={{ color: 'var(--text-dim)' }}>Completing Masky login…</p>
        </>
      )}
    </main>
  )
}
