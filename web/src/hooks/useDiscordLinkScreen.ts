import { useProjectedActor } from './useProjectedActor'
import { useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { discordLinkCopy } from '../copy/discordLink'
import { ApiError } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
import { hasDiscordLinkInFlight, postDiscordLink } from '../lib/discordLink'
import {
  clearDiscordLinkConsent,
  clearDiscordLinkToken,
  getDiscordLinkConsent,
  getDiscordLinkToken,
  setDiscordLinkConsent,
  setDiscordLinkToken,
  setPostLogin,
} from '../lib/sessionBus'
import {
  discordLinkMachine,
  type DiscordLinkFailure,
  type DiscordLinkPhase,
} from '../stores/discordLinkMachine'
import { useStores } from '../stores/StoresContext'
import { useMountEffect } from './useMountEffect'

const copy = discordLinkCopy

const BUSY_MESSAGE: Partial<Record<DiscordLinkPhase, string>> = copy.busy

const FAILURE_BODY: Record<DiscordLinkFailure, string> = copy.error.body

/** Only a transport hiccup is worth re-POSTing; a consumed token stays consumed. */
const RETRYABLE: Record<DiscordLinkFailure, boolean> = {
  'missing-token': false,
  expired: false,
  login: false,
  unreachable: true,
}

const failureOf = (e: unknown): DiscordLinkFailure =>
  e instanceof ApiError && (e.status === 400 || e.status === 404 || e.status === 410)
    ? 'expired'
    : 'unreachable'

export interface DiscordLinkScreenModel {
  phase: DiscordLinkPhase
  heading: string | null
  documentTitle: string
  showConfirm: boolean
  showBusy: boolean
  showDone: boolean
  showError: boolean
  busyMessage: string | null
  errTitle: string | null
  errBody: string | null
  canRetry: boolean
  connectLabel: string
  notNowLabel: string
  nextHeading: string
  command: string
  privacyLead: string
  privacyRest: string
  successLead: string
  successRest: string
  retryLabel: string
  homeLabel: string
  onConfirm: () => void
  onRetry: () => void
}

/** Everything `DiscordLinkScreen` renders. The hook is the engine; the screen is the terminal. */
export function useDiscordLinkScreen(): DiscordLinkScreenModel {
  const [params] = useSearchParams()
  const { auth } = useStores()
  const [snapshot, send] = useProjectedActor(discordLinkMachine)
  const tokenRef = useRef<string | null>(null)
  const ctx = snapshot.context
  const phase = snapshot.value as DiscordLinkPhase
  /* Newest /memeon-connect token wins while auth is still loading (checking). After READY/LINK
     the token is frozen so Try again still has the one the POST consumed. */
  if (phase === 'checking') {
    tokenRef.current = params.get('token') ?? getDiscordLinkToken()
  }

  const followLink = (token: string, live: () => boolean): void => {
    void postDiscordLink(token).then(
      () => {
        if (!live()) return
        clearDiscordLinkToken()
        send({ type: 'DONE' })
      },
      (e) => {
        if (!live()) return
        send({ type: 'FAIL', failure: failureOf(e) })
      },
    )
  }

  useMountEffect(() => {
    let cancelled = false
    const settle = () => {
      if (cancelled || auth.loading) return
      const token = tokenRef.current
      if (!token) {
        send({ type: 'FAIL', failure: 'missing-token' })
        return
      }
      // consent already given before the SSO bounce: finish the job instead of re-asking
      if (auth.user && (getDiscordLinkConsent() || hasDiscordLinkInFlight(token))) {
        clearDiscordLinkConsent()
        send({ type: 'LINK' })
        followLink(token, () => !cancelled)
        return
      }
      send({ type: 'READY' })
    }
    settle()
    const unsubscribe = auth.subscribe(settle)
    return () => {
      cancelled = true
      unsubscribe()
    }
  })

  const onConfirm = (): void => {
    const token = tokenRef.current
    if (!token) {
      send({ type: 'FAIL', failure: 'missing-token' })
      return
    }
    if (!auth.user) {
      setDiscordLinkToken(token)
      setDiscordLinkConsent('1')
      setPostLogin('/discord/link')
      send({ type: 'LOGIN' })
      void beginMaskyLogin().catch(() => send({ type: 'FAIL', failure: 'login' }))
      return
    }
    send({ type: 'LINK' })
    followLink(token, () => true)
  }

  const onRetry = (): void => {
    const token = tokenRef.current
    if (!token) {
      send({ type: 'FAIL', failure: 'missing-token' })
      return
    }
    send({ type: 'RETRY' })
    followLink(token, () => true)
  }

  const showError = phase === 'error'
  const showDone = phase === 'done'

  return {
    phase,
    heading: showError ? null : showDone ? copy.done : copy.heading,
    documentTitle: copy.documentTitle,
    showConfirm: phase === 'confirm',
    showBusy: phase === 'checking' || phase === 'redirecting' || phase === 'working',
    showDone,
    showError,
    busyMessage: BUSY_MESSAGE[phase] ?? null,
    errTitle: showError ? copy.error.title : null,
    errBody: showError && ctx.failure ? FAILURE_BODY[ctx.failure] : null,
    canRetry: showError && !!ctx.failure && RETRYABLE[ctx.failure],
    connectLabel: copy.connect,
    notNowLabel: copy.notNow,
    nextHeading: copy.nextHeading,
    command: copy.command,
    privacyLead: copy.privacy.lead,
    privacyRest: copy.privacy.rest,
    successLead: copy.success.lead,
    successRest: copy.success.rest,
    retryLabel: copy.retry,
    homeLabel: copy.home,
    onConfirm,
    onRetry,
  }
}
