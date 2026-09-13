import { useProjectedActor } from './useProjectedActor'
import { useNavigate, useParams } from 'react-router-dom'
import { inviteCopy } from '../copy/invite'
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
import type { ButtonHTMLAttributes } from 'react'

export const INVITE_KEY = 'memeon_invite_from'

const copy = inviteCopy

export interface InviteScreenModel {
  phase: InvitePhase
  err: string | null
  showFatalError: boolean
  showSpinner: boolean
  showAcceptError: boolean
  showAcceptSuccess: boolean
  showHighlights: boolean
  loadingLabel: string
  /** the sentence under the hero: one line, product language, never "invest" */
  inviteBody: string
  /** Closing line under the highlight cards. */
  climbNote: string
  acceptErrorMessage: string
  acceptSuccessMessage: string
  highlightsTitle: string
  fatalActions: InviteFatalActions
  selfActions: InviteSelfActions | null
  inviter: InviteInviterModel | null
  cards: readonly InviteCardModel[]
  acceptButtonProps: InviteButtonProps
  acceptLabel: string
}

type InviteButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'aria-disabled' | 'aria-busy'
>

/** The dead-link branch is a screen, not a cul-de-sac: it always offers a way in. */
interface InviteFatalActions {
  title: string
  joinLabel: string
  joinButtonProps: InviteButtonProps
  homeLabel: string
  homeHref: string
}

/** The owner of the link gets something to do with it instead of an instruction. */
interface InviteSelfActions {
  note: string
  copyLabel: string
  copyStatusMessage: string
  copyButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  friendsLabel: string
  friendsHref: string
}

export interface InviteStatModel {
  id: string
  emoji: string
  value: string
  label: string
}

interface InviteInviterModel {
  name: string
  /** `<Avatar>` draws the monogram fallback itself whenever there is no picture. */
  avatarSrc: string | null
  stats: readonly InviteStatModel[]
  acceptanceNote: string
}

interface InviteCardModel {
  id: string
  memeCard: MemeCardModel
}

export function inviteAcceptPayload(inviterId: string): { inviterId: string } {
  return { inviterId }
}

export function buildInviteStats(inviter: {
  collectionSize: number
  portfolioValue: number
  followers: number
}): readonly InviteStatModel[] {
  const stats = copy.stats
  return [
    { id: 'binder', emoji: stats.binder.emoji, value: inviter.collectionSize.toLocaleString(), label: stats.binder.label },
    {
      id: 'braincells',
      emoji: stats.braincells.emoji,
      value: inviter.portfolioValue.toLocaleString(),
      label: stats.braincells.label(inviter.portfolioValue),
    },
    {
      id: 'followers',
      emoji: stats.followers.emoji,
      value: inviter.followers.toLocaleString(),
      label: stats.followers.label(inviter.followers),
    },
  ]
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
      .catch(() => send({ type: 'FAIL', err: copy.errors.load }))
  })

  const inviter = ctx.data?.inviter
  const isSelf = !!user && !!inviter && user.sub === inviter.sub

  const onAccept = () => {
    // aria-disabled keeps the button focusable while it works, so the guard lives here
    if (!sub || ctx.busy) return
    send({ type: 'ACCEPT' })
    const run = async () => {
      if (user) {
        await post('/api/invites/accept', inviteAcceptPayload(sub))
        send({ type: 'ACCEPTED' })
        // the arrival carries the outcome: /friends confirms it instead of guessing
        navigate('/friends', { state: { invitedBy: inviter?.name ?? null } })
        return
      }
      sessionStorage.setItem(INVITE_KEY, sub)
      await beginMaskyLogin()
    }
    void run().catch((e) => {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.acceptFallback })
    })
  }

  const onJoin = () => {
    if (ctx.busy) return
    send({ type: 'JOIN' })
    void beginMaskyLogin().catch((e) => {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.masky })
    })
  }

  const onCopy = () => {
    const link = window.location.href
    void Promise.resolve(navigator.clipboard?.writeText(link))
      .then(() => send({ type: 'COPIED', ok: true }))
      .catch(() => send({ type: 'COPIED', ok: false }))
  }

  const copyLabel =
    ctx.copy === 'copied' ? copy.self.copied : ctx.copy === 'failed' ? copy.self.copyFailed : copy.self.copy

  return {
    phase,
    err: ctx.err,
    showFatalError: !!ctx.err && !ctx.data,
    showSpinner: !ctx.data && !ctx.err,
    showAcceptError: !!ctx.err && !!ctx.data,
    showAcceptSuccess: ctx.accepted && !!ctx.data,
    showHighlights: !!ctx.data && ctx.data.topMemes.length > 0,
    loadingLabel: copy.loading,
    inviteBody: copy.body,
    climbNote: copy.climbNote,
    acceptErrorMessage: copy.errors.accept,
    acceptSuccessMessage: copy.accept.success(inviter?.name ?? copy.fallbackInviterName),
    highlightsTitle: copy.highlightsTitle(inviter?.name ?? ''),
    fatalActions: {
      title: copy.fatal.title,
      joinLabel: ctx.busy ? copy.openingMasky : copy.fatal.join,
      joinButtonProps: {
        onClick: onJoin,
        'aria-disabled': ctx.busy || undefined,
        'aria-busy': ctx.busy || undefined,
      },
      homeLabel: copy.fatal.home,
      homeHref: '/',
    },
    selfActions: isSelf
      ? {
          note: copy.self.note,
          copyLabel,
          copyStatusMessage:
            ctx.copy === 'copied' ? copy.self.copiedStatus : ctx.copy === 'failed' ? copy.self.copyFailedStatus : '',
          copyButtonProps: { onClick: onCopy },
          friendsLabel: copy.self.friends,
          friendsHref: '/friends',
        }
      : null,
    inviter: inviter
      ? {
          name: inviter.name,
          avatarSrc: inviter.picture,
          stats: buildInviteStats(inviter),
          acceptanceNote: isSelf ? copy.acceptanceNote.self : copy.acceptanceNote.guest(inviter.name),
        }
      : null,
    cards: (ctx.data?.topMemes ?? []).map((meme) => ({ id: meme.id, memeCard: buildMemeCardModel(meme) })),
    acceptButtonProps: {
      onClick: onAccept,
      'aria-disabled': ctx.busy || undefined,
      'aria-busy': ctx.busy || undefined,
    },
    // the busy label keeps the ready label's emoji, so the glyph never blinks out mid-press
    acceptLabel: ctx.busy
      ? user
        ? copy.accept.adding(inviter?.name ?? copy.fallbackInviterName)
        : copy.openingMasky
      : user
        ? copy.accept.befriend(inviter?.name ?? '')
        : copy.accept.join(inviter?.name ?? copy.accept.joinFallbackName),
  }
}
