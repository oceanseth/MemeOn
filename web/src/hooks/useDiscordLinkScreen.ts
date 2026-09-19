import { useProjectedActor } from './useProjectedActor'
import { useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { discordLinkCopy } from '../copy/discordLink'
import { ApiError, post } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
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
  const settled = useRef(false)
  const tokenRef = useRef<string | null>(null)
  /* A fresh /memeon-connect link can land on this screen while the first one is still waiting on
     auth, so the newest token wins until the flow settles — then it is kept, because the POST
     clears the stashed copy and Try again still needs the token it consumed. */
  if (!settled.current) {
    tokenRef.current = params.get('token') ?? getDiscordLinkToken()
  }
  const ctx = snapshot.context
  const phase = snapshot.value as DiscordLinkPhase

  const link = (token: string): void => {
    clearDiscordLinkToken()
    post('/api/discord/link', { token })
      .then(() => send({ type: 'DONE' }))
      .catch((e) => send({ type: 'FAIL', failure: failureOf(e) }))
  }

  useMountEffect(() => {
    const settle = () => {
      if (auth.loading || settled.current) return
      settled.current = true
      const token = tokenRef.current
      if (!token) {
        send({ type: 'FAIL', failure: 'missing-token' })
        return
      }
      // consent already given before the SSO bounce: finish the job instead of re-asking
      if (auth.user && getDiscordLinkConsent()) {
        clearDiscordLinkConsent()
        send({ type: 'LINK' })
        link(token)
        return
      }
      send({ type: 'READY' })
    }
    settle()
    return auth.subscribe(settle)
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
    link(token)
  }

  const onRetry = (): void => {
    const token = tokenRef.current
    if (!token) {
      send({ type: 'FAIL', failure: 'missing-token' })
      return
    }
    send({ type: 'RETRY' })
    link(token)
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
