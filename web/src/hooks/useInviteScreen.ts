import { useProjectedActor } from './useProjectedActor'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { avatarErrorHandler } from '../lib/avatarModel'
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
  showFatalError: boolean
  showSpinner: boolean
  showAcceptError: boolean
  showAcceptSuccess: boolean
  showAcceptSpinner: boolean
  showHighlights: boolean
  loadingLabel: string
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

/** The ring always renders: a monogram stands in when Masky has no picture. */
export type InviteAvatarModel =
  | {
      kind: 'image'
      imageProps: Pick<
        ImgHTMLAttributes<HTMLImageElement>,
        'src' | 'alt' | 'width' | 'height' | 'loading' | 'referrerPolicy' | 'onError'
      >
    }
  | { kind: 'monogram'; initial: string }

export interface InviteStatModel {
  id: string
  emoji: string
  value: string
  label: string
}

interface InviteInviterModel {
  name: string
  avatar: InviteAvatarModel
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

/** First visible grapheme of a display name, for the monogram fallback. */
function monogramInitial(name: string): string {
  return ([...name.trim()][0] ?? '?').toUpperCase()
}

export function buildInviteStats(inviter: {
  collectionSize: number
  portfolioValue: number
  followers: number
}): readonly InviteStatModel[] {
  return [
    { id: 'binder', emoji: '📚', value: inviter.collectionSize.toLocaleString(), label: 'in binder' },
    { id: 'braincells', emoji: '🧠', value: inviter.portfolioValue.toLocaleString(), label: 'braincells' },
    { id: 'followers', emoji: '⭐', value: inviter.followers.toLocaleString(), label: 'followers' },
  ]
}

export function buildInviteAvatar(inviter: { name: string; picture: string | null }): InviteAvatarModel {
  return inviter.picture
    ? {
        kind: 'image',
        imageProps: {
          src: inviter.picture,
          // the h1 already names the inviter; a duplicate alt reads the name twice
          alt: '',
          width: 96,
          height: 96,
          loading: 'eager',
          referrerPolicy: 'no-referrer',
          onError: avatarErrorHandler(inviter.name),
        },
      }
    : { kind: 'monogram', initial: monogramInitial(inviter.name) }
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
    showAcceptSpinner: ctx.busy,
    showHighlights: !!ctx.data && ctx.data.topMemes.length > 0,
    loadingLabel: 'Loading invite…',
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
          avatar: buildInviteAvatar(inviter),
          stats: buildInviteStats(inviter),
          acceptanceNote: isSelf
            ? "Send this link to a friend — they'll join with Masky and you'll be friends instantly."
            : `Joining creates your account with Masky single sign-on and instantly makes you and ${inviter.name} friends.`,
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
        : '🎭 Accept invite — join with Masky',
  }
}
