import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { IconName } from '@/atoms/icon'
import { authStatusCopy } from '../copy/authStatus'
import { inviteCopy } from '../copy/invite'
import { beginMaskyLogin, completeMaskyLogin } from '../lib/auth'
import { post } from '../lib/api'
import { clearInviteFrom, clearPostLogin, getInviteFrom, getPostLogin } from '../lib/sessionBus'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

const copy = authStatusCopy.callback

/** Shared auth status card for OAuth callback and mobile forward. */
export interface AuthStatusScreenModel {
  /** `working` draws the ring; `error` swaps it for the failure title and an `Alert`. */
  phase: 'working' | 'error'
  /** Tab title; distinct from on-screen `title` (no ellipsis / “MemeOn app”). */
  documentTitle: string
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
 * The Masky OAuth redirect: exchange the single-use code once (useMountEffect + one in-flight
 * Promise per code in lib/auth), finish a pending invite, refresh the session and leave for the
 * route the login started from.
 */
export function useAuthCallbackScreen(): AuthStatusScreenModel {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [err, setErr] = useState<string | null>(null)
  const [inviteFailed, setInviteFailed] = useState(false)
  const [pendingInviterId, setPendingInviterId] = useState<string | null>(null)
  const [pendingPostLogin, setPendingPostLogin] = useState<string | null>(null)

  useMountEffect(() => {
    let cancelled = false
    const code = params.get('code')
    if (!code) {
      setErr(params.get('error') ?? copy.errors.missingCode)
      return
    }
    completeMaskyLogin(code, params.get('state'))
      .then(async () => {
        if (cancelled) return
        // finish an invite if this login started from an invite link
        const inviterId = getInviteFrom()
        clearInviteFrom()
        const postLogin = getPostLogin()
        clearPostLogin()
        setPendingInviterId(inviterId)
        setPendingPostLogin(postLogin)
        if (inviterId) {
          try {
            await post('/api/invites/accept', { inviterId })
          } catch {
            if (cancelled) return
            await refresh()
            if (cancelled) return
            setInviteFailed(true)
            setErr(inviteCopy.errors.accept)
            return
          }
        }
        if (cancelled) return
        await refresh()
        if (cancelled) return
        navigate(postLogin ?? (inviterId ? '/friends' : '/marketplace'), { replace: true })
      })
      .catch((e) => {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : copy.errors.loginFailed)
      })
    return () => {
      cancelled = true
    }
  })

  /* Failed hand-off offers retry instead of an endless spinner. Invite-fail retry re-POSTs accept. */
  const retry = () => {
    if (inviteFailed) {
      const inviterId = pendingInviterId
      const postLogin = pendingPostLogin
      setInviteFailed(false)
      setErr(null)
      void (async () => {
        try {
          if (inviterId) await post('/api/invites/accept', { inviterId })
          await refresh()
          navigate(postLogin ?? (inviterId ? '/friends' : '/marketplace'), { replace: true })
        } catch {
          setInviteFailed(true)
          setErr(inviteCopy.errors.accept)
        }
      })()
      return
    }
    setErr(null)
    void beginMaskyLogin().catch((e) => setErr(e instanceof Error ? e.message : copy.errors.loginFailed))
  }

  return {
    phase: err ? 'error' : 'working',
    documentTitle: copy.documentTitle,
    title: err ? (inviteFailed ? copy.inviteFailed.title : copy.failed.title) : copy.working.title,
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
