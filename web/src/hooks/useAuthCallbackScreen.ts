import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { IconName } from '@/atoms/icon'
import { authStatusCopy } from '../copy/authStatus'
import { beginMaskyLogin, completeMaskyLogin } from '../lib/auth'
import { post } from '../lib/api'
import { clearInviteFrom, clearPostLogin, getInviteFrom, getPostLogin } from '../lib/sessionBus'
import { useAuth } from './useAuth'

const copy = authStatusCopy.callback

/** Shared auth status card for OAuth callback and mobile forward. */
export interface AuthStatusScreenModel {
  /** `working` draws the ring; `error` swaps it for the failure title and an `Alert`. */
  phase: 'working' | 'error'
  title: string
  /** the line under the title while working; `null` hides it */
  subtitle: string | null
  /** the failure message, only in `error` */
  error: string | null
  /** the page's one primary, when it has one (the mobile forward's "Open MemeOn") */
  primaryAction: { label: string; href: string; icon: IconName } | null
  /** the quiet way out under the card body */
  fallback: {
    /** "Taking longer than usual?" — `null` hides the line */
    prompt: string | null
    /** the companion retry, ultraviolet, never the page's primary */
    retry: { label: string; onClick: () => void } | null
    /** always present: the underlined text link home */
    home: { label: string; to: string }
  }
}

/**
 * The Masky OAuth redirect: exchange the single-use code once (StrictMode replays the effect, so
 * a ref guards it), finish a pending invite, refresh the session and leave for the route the login
 * started from.
 */
export function useAuthCallbackScreen(): AuthStatusScreenModel {
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
      setErr(params.get('error') ?? copy.errors.missingCode)
      return
    }
    completeMaskyLogin(code, params.get('state'))
      .then(async () => {
        // finish an invite if this login started from an invite link
        const inviterId = getInviteFrom()
        clearInviteFrom()
        if (inviterId) {
          await post('/api/invites/accept', { inviterId }).catch(() => {})
        }
        const postLogin = getPostLogin()
        clearPostLogin()
        await refresh()
        navigate(postLogin ?? (inviterId ? '/friends' : '/marketplace'), { replace: true })
      })
      .catch((e) => setErr(e instanceof Error ? e.message : copy.errors.loginFailed))
  }, [params, navigate, refresh])

  /* Failed hand-off offers retry instead of an endless spinner. */
  const retry = () => {
    setErr(null)
    void beginMaskyLogin().catch((e) => setErr(e instanceof Error ? e.message : copy.errors.loginFailed))
  }

  return {
    phase: err ? 'error' : 'working',
    title: err ? copy.failed.title : copy.working.title,
    subtitle: err ? null : copy.working.subtitle,
    error: err,
    primaryAction: null,
    fallback: {
      prompt: err ? null : copy.working.prompt,
      retry: { label: copy.retry, onClick: retry },
      home: { label: copy.home, to: '/' },
    },
  }
}
