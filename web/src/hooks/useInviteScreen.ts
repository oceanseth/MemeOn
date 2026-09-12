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
import type { ButtonHTMLAttributes } from 'react'

export const INVITE_KEY = 'memeon_invite_from'

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
  return [
    { id: 'binder', emoji: '📚', value: inviter.collectionSize.toLocaleString(), label: 'in binder' },
    {
      id: 'braincells',
      emoji: '🧠',
      value: inviter.portfolioValue.toLocaleString(),
      label: inviter.portfolioValue === 1 ? 'braincell' : 'braincells',
    },
    {
      id: 'followers',
      emoji: '⭐',
      value: inviter.followers.toLocaleString(),
      label: inviter.followers === 1 ? 'follower' : 'followers',
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
      .catch(() => send({ type: 'FAIL', err: 'This invite link is invalid or expired.' }))
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
      send({ type: 'FAIL', err: e instanceof Error ? e.message : 'accept request failed' })
    })
  }

  const onJoin = () => {
    if (ctx.busy) return
    send({ type: 'JOIN' })
    void beginMaskyLogin().catch((e) => {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : 'Could not reach Masky — try again.' })
    })
  }

  const onCopy = () => {
    const link = window.location.href
    void Promise.resolve(navigator.clipboard?.writeText(link))
      .then(() => send({ type: 'COPIED', ok: true }))
      .catch(() => send({ type: 'COPIED', ok: false }))
  }

  const copyLabel =
    ctx.copy === 'copied'
      ? '✅ Link copied'
      : ctx.copy === 'failed'
        ? '⚠️ Copy failed — try again'
        : '🔗 Copy invite link'

  return {
    phase,
    err: ctx.err,
    showFatalError: !!ctx.err && !ctx.data,
    showSpinner: !ctx.data && !ctx.err,
    showAcceptError: !!ctx.err && !!ctx.data,
    showAcceptSuccess: ctx.accepted && !!ctx.data,
    showHighlights: !!ctx.data && ctx.data.topMemes.length > 0,
    loadingLabel: 'Loading invite…',
    inviteBody:
      'Mint memes, share the link, and trade your friends’ bangers before they go ✨Shiny✨.',
    climbNote: 'Every share makes the card climb.',
    acceptErrorMessage: "Couldn't accept this invite — try again.",
    acceptSuccessMessage: `You and ${inviter?.name ?? 'your pal'} are now friends 🤝`,
    highlightsTitle: `${inviter?.name ?? ''}'s binder highlights`,
    fatalActions: {
      title: 'This invite link expired',
      joinLabel: ctx.busy ? '🎭 Opening Masky…' : '🎭 Join MemeOn anyway',
      joinButtonProps: {
        onClick: onJoin,
        'aria-disabled': ctx.busy || undefined,
        'aria-busy': ctx.busy || undefined,
      },
      homeLabel: 'Back to MemeOn',
      homeHref: '/',
    },
    selfActions: isSelf
      ? {
          note: 'This is your own invite link — send it to a friend!',
          copyLabel,
          copyStatusMessage:
            ctx.copy === 'copied'
              ? 'Invite link copied to your clipboard.'
              : ctx.copy === 'failed'
                ? 'Could not copy the link. Try again.'
                : '',
          copyButtonProps: { onClick: onCopy },
          friendsLabel: 'See your friends',
          friendsHref: '/friends',
        }
      : null,
    inviter: inviter
      ? {
          name: inviter.name,
          avatarSrc: inviter.picture,
          stats: buildInviteStats(inviter),
          acceptanceNote: isSelf
            ? "Send this link to a friend — they'll join with Masky and you'll be friends instantly."
            : `Sign in with your Masky avatar. You start with a free starter pack and ${inviter.name} as your first friend.`,
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
        ? `🤝 Adding ${inviter?.name ?? 'your pal'}…`
        : '🎭 Opening Masky…'
      : user
        ? `🤝 Accept & befriend ${inviter?.name ?? ''}`
        : `🎭 Join ${inviter?.name ?? 'MemeOn'} on MemeOn`,
  }
}
