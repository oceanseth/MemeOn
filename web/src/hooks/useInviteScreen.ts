import { useMachine } from '@xstate/react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { beginMaskyLogin } from '../lib/auth'
import {
  inviteMachine,
  type InviteData,
  type InvitePhase,
} from '../stores/inviteMachine'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

export const INVITE_KEY = 'memeon_invite_from'

export type { InviteData, InviteInviter } from '../stores/inviteMachine'

export interface InviteScreenModel {
  phase: InvitePhase
  data: InviteData | null
  err: string | null
  busy: boolean
  isSelf: boolean
  showFatalError: boolean
  showSpinner: boolean
  showAcceptError: boolean
  showHighlights: boolean
  acceptLabel: string
  onAccept: () => void
}

/** Everything `InviteScreen` renders. The hook is the engine; the screen is the terminal. */
export function useInviteScreen(): InviteScreenModel {
  const { sub } = useParams<{ sub: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [snapshot, send] = useMachine(inviteMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as InvitePhase

  useMountEffect(() => {
    if (!sub) return
    apiFetch<InviteData>(`/api/invite/${encodeURIComponent(sub)}`)
      .then((data) => send({ type: 'DONE', data }))
      .catch(() => send({ type: 'FAIL', err: 'This invite link is invalid or expired.' }))
  })

  const onAccept = () => {
    if (!sub) return
    send({ type: 'ACCEPT' })
    const run = async () => {
      if (user) {
        await post('/api/invites/accept', { inviterId: sub })
        send({ type: 'ACCEPTED' })
        navigate('/friends')
        return
      }
      sessionStorage.setItem(INVITE_KEY, sub)
      await beginMaskyLogin()
    }
    void run().catch((e) => {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : 'something went wrong' })
    })
  }

  const inviter = ctx.data?.inviter
  const isSelf = !!user && !!inviter && user.sub === inviter.sub

  return {
    phase,
    data: ctx.data,
    err: ctx.err,
    busy: ctx.busy,
    isSelf,
    showFatalError: !!ctx.err && !ctx.data,
    showSpinner: !ctx.data && !ctx.err,
    showAcceptError: !!ctx.err && !!ctx.data,
    showHighlights: !!ctx.data && ctx.data.topMemes.length > 0,
    acceptLabel: ctx.busy
      ? 'Opening Masky…'
      : user
        ? `🤝 Accept & befriend ${inviter?.name ?? ''}`
        : '🎭 Accept invite — join with Masky',
    onAccept,
  }
}
