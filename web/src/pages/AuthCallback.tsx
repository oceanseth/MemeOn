import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../atoms/Button'
import { Notice } from '../atoms/Notice'
import { PageContainer } from '../atoms/PageContainer'
import { Spinner } from '../atoms/Spinner'
import { completeMaskyLogin } from '../lib/auth'
import { post } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { INVITE_KEY } from '../hooks/useInviteScreen'

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
        const postLogin = sessionStorage.getItem('memeon_post_login')
        sessionStorage.removeItem('memeon_post_login')
        await refresh()
        navigate(postLogin ?? (inviterId ? '/friends' : '/marketplace'), { replace: true })
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'login failed'))
  }, [params, navigate, refresh])

  return (
    <PageContainer as="main" id="main" tabIndex={-1} className="pt-[90px] text-center">
      {err ? (
        <>
          <Notice tone="error">{err}</Notice>
          <div className="mt-3.5">
            <Button onClick={() => navigate('/')}>Back home</Button>
          </div>
        </>
      ) : (
        <>
          <Spinner />
          <p className="[margin-block:1em] text-text-dim">Completing Masky login…</p>
        </>
      )}
    </PageContainer>
  )
}
