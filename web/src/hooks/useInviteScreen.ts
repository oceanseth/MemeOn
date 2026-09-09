import { useProjectedActor } from './useProjectedActor'
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
import { buildMemeCardModel, type MemeCardModel } from '../lib/memeCardModel'
import type { ButtonHTMLAttributes, ImgHTMLAttributes } from 'react'

export const INVITE_KEY = 'memeon_invite_from'

export type { InviteData, InviteInviter } from '../stores/inviteMachine'

export interface InviteScreenModel {
  phase: InvitePhase
  err: string | null
  isSelf: boolean
  showFatalError: boolean
  showSpinner: boolean
  showAcceptError: boolean
  showHighlights: boolean
  inviter: InviteInviterModel | null
  cards: readonly InviteCardModel[]
  acceptButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>
  acceptLabel: string
}

interface InviteInviterModel {
  name: string
  hasPicture: boolean
  imageProps: Pick<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>
  statsLabel: string
  acceptanceNote: string
}

interface InviteCardModel {
  id: string
  memeCard: MemeCardModel
}

export function inviteAcceptPayload(inviterId: string): { inviterId: string } {
  return { inviterId }
}

/** Everything `InviteScreen` renders. The hook is the engine; the screen is the terminal. */
export function useInviteScreen(): InviteScreenModel {
  const { sub } = useParams<{ sub: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [snapshot, send] = useProjectedActor(inviteMachine)
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
        await post('/api/invites/accept', inviteAcceptPayload(sub))
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
    err: ctx.err,
    isSelf,
    showFatalError: !!ctx.err && !ctx.data,
    showSpinner: !ctx.data && !ctx.err,
    showAcceptError: !!ctx.err && !!ctx.data,
    showHighlights: !!ctx.data && ctx.data.topMemes.length > 0,
    inviter: inviter
      ? {
          name: inviter.name,
          hasPicture: !!inviter.picture,
          imageProps: { src: inviter.picture ?? '', alt: inviter.name },
          statsLabel: `📚 ${inviter.collectionSize} memes collected · 🧠 ${inviter.portfolioValue.toLocaleString()} portfolio · ⭐ ${inviter.followers} followers`,
          acceptanceNote: `Joining creates your account with Masky single sign-on and instantly makes you and ${inviter.name} friends.`,
        }
      : null,
    cards: (ctx.data?.topMemes ?? []).map((meme) => ({ id: meme.id, memeCard: buildMemeCardModel(meme) })),
    acceptButtonProps: { onClick: onAccept, disabled: ctx.busy },
    acceptLabel: ctx.busy
      ? 'Opening Masky…'
      : user
        ? `🤝 Accept & befriend ${inviter?.name ?? ''}`
        : '🎭 Accept invite — join with Masky',
  }
}
