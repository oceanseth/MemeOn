import { useCallback } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ApiError, apiFetch, post } from '../lib/api'
import { avatarErrorHandler } from '../lib/avatarModel'
import type { Meme } from '../lib/types'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { useProjectedActor } from './useProjectedActor'
import { profileMachine, type ProfileData, type ProfileTab } from '../stores/profileMachine'
import { buildMemeCardModel, type MemeCardModel } from '../lib/memeCardModel'
import type { ButtonHTMLAttributes, ImgHTMLAttributes } from 'react'
import type { LinkProps } from 'react-router-dom'

export type { ProfileData, ProfileTab } from '../stores/profileMachine'

export interface ProfileScreenModel {
  showErr: boolean
  errTitle: string
  errBody: string
  retryLabel: string
  retryButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  errorLinkLabel: string
  errorLinkProps: Pick<LinkProps, 'to'>
  showLoading: boolean
  loadingLabel: string
  profile: ProfileViewModel | null
  showActions: boolean
  followButtonClassName: string
  followGlyph: string
  followText: string
  followButtonProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'aria-pressed' | 'aria-busy' | 'disabled'
  >
  showFriendButton: boolean
  friendGlyph: string
  friendText: string
  friendButtonProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'aria-busy' | 'disabled'
  >
  showFriendChip: boolean
  friendChipGlyph: string
  friendChipText: string
  showActionErr: boolean
  actionErr: string
  showJoin: boolean
  joinLabel: string
  joinLinkProps: Pick<LinkProps, 'to' | 'state'>
  createdCount: number
  binderCount: number
  cards: readonly ProfileCardModel[]
  showEmpty: boolean
  emptyTitle: string
  emptyBody: string
  showEmptyLink: boolean
  emptyLinkLabel: string
  emptyLinkProps: Pick<LinkProps, 'to'>
  showGrid: boolean
  createdTabClassName: string
  binderTabClassName: string
  createdTabButtonProps: ProfileTabButtonProps
  binderTabButtonProps: ProfileTabButtonProps
  gridProps: ProfileGridProps
}

type ProfileTabButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'aria-pressed' | 'aria-controls'
>

interface ProfileGridProps {
  id: string
  'aria-live': 'polite'
  'aria-label': string
}

interface ProfileCardModel {
  id: string
  memeCard: MemeCardModel
  sharesLabel: string | null
}

/** Stat glyphs stay visible for wayfinding but never enter the accessible name. */
export interface ProfileStat {
  id: string
  glyph: string
  text: string
}

type ProfileAvatarModel =
  | {
      kind: 'image'
      imageProps: Pick<
        ImgHTMLAttributes<HTMLImageElement>,
        'src' | 'alt' | 'width' | 'height' | 'loading' | 'referrerPolicy' | 'onError'
      >
    }
  | { kind: 'initial'; initial: string }

interface ProfileViewModel {
  name: string
  avatar: ProfileAvatarModel
  stats: readonly ProfileStat[]
}

const CARDS_ID = 'profile-cards'

export function buildProfileTabProps(
  tab: ProfileTab,
  itemCount: number,
  onTabChange: (tab: ProfileTab) => void,
): Pick<
  ProfileScreenModel,
  'createdTabClassName' | 'binderTabClassName' | 'createdTabButtonProps' | 'binderTabButtonProps' | 'gridProps'
> {
  return {
    createdTabClassName: tab === 'created' ? 'primary' : '',
    binderTabClassName: tab === 'binder' ? 'primary' : '',
    createdTabButtonProps: {
      'aria-pressed': tab === 'created',
      'aria-controls': CARDS_ID,
      onClick: () => onTabChange('created'),
    },
    binderTabButtonProps: {
      'aria-pressed': tab === 'binder',
      'aria-controls': CARDS_ID,
      onClick: () => onTabChange('binder'),
    },
    gridProps: {
      id: CARDS_ID,
      'aria-live': 'polite',
      'aria-label': `${tab === 'created' ? 'Created' : 'Binder'} memes, ${plural(itemCount, 'card')}`,
    },
  }
}

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`

const firstGrapheme = (name: string): string => [...name][0]?.toUpperCase() ?? '?'

/** Everything `ProfileScreen` renders. The route actor owns data, errors, tabs and action state. */
export function useProfileScreen({
  initialTab = 'created',
}: {
  initialTab?: ProfileTab
} = {}): ProfileScreenModel {
  const { sub } = useParams<{ sub: string }>()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [snapshot, send] = useProjectedActor(profileMachine, { input: { initialTab } })
  const { data, tab, err, errKind, busy, actionErr } = snapshot.context

  const load = useCallback(() => {
    if (!sub) return
    apiFetch<ProfileData>(`/api/users/${encodeURIComponent(sub)}/profile`)
      .then((data) => send({ type: 'DONE', data }))
      .catch((cause: unknown) =>
        send({
          type: 'FAIL',
          err: cause instanceof Error ? cause.message : 'profile load failed',
          kind: cause instanceof ApiError && cause.status === 404 ? 'notfound' : 'transport',
        }),
      )
  }, [send, sub])

  useMountEffect(() => {
    load()
  })

  const profile = data?.profile ?? null
  const isSelf = !!user && !!profile && user.sub === profile.sub
  const friendStatus = data?.friendStatus ?? null
  const followingByMe = data?.followingByMe ?? false
  const memes: (Meme & { shares?: number })[] = data
    ? tab === 'created'
      ? data.created
      : data.binder
    : []

  const onToggleFollow = useCallback(async () => {
    if (!profile || busy) return
    const following = !followingByMe
    send({ type: 'BEGIN_ACTION' })
    try {
      await post(`/api/users/${encodeURIComponent(profile.sub)}/${following ? 'follow' : 'unfollow'}`, {})
      send({ type: 'SET_FOLLOWING', following })
      send({ type: 'SETTLE_ACTION' })
      load()
    } catch {
      send({ type: 'FAIL_ACTION', err: "Couldn't update — try again." })
    }
  }, [busy, followingByMe, load, profile, send])

  const onFriendAction = useCallback(async () => {
    if (!profile || busy) return
    if (friendStatus !== null && friendStatus !== 'incoming') return
    send({ type: 'BEGIN_ACTION' })
    try {
      if (friendStatus === null) await post('/api/friends/request', { userId: profile.sub })
      else await post('/api/friends/respond', { userId: profile.sub, accept: true })
      send({ type: 'SETTLE_ACTION' })
      load()
    } catch {
      send({ type: 'FAIL_ACTION', err: "Couldn't update — try again." })
    }
  }, [busy, friendStatus, load, profile, send])

  const isEmpty = !!data && memes.length === 0
  const ownName = profile?.name ?? 'this player'
  const emptyCopy = !isEmpty
    ? { title: '', body: '', link: null }
    : isSelf
      ? tab === 'created'
        ? {
            title: "You haven't minted anything yet.",
            body: 'Every meme you mint lands here as a 100-share card.',
            link: { label: 'Mint your first meme', to: '/binder/new' },
          }
        : {
            title: "You don't hold shares in any memes yet.",
            body: "Buy into someone else's card and your shares show up here.",
            link: { label: 'Browse the marketplace', to: '/marketplace' },
          }
      : tab === 'created'
        ? {
            title: `${ownName} hasn't minted anything yet.`,
            body: 'New cards land here the moment they mint one.',
            link: null,
          }
        : {
            title: `${ownName} doesn't hold shares in any memes yet.`,
            body: 'Shares they buy, win or get gifted show up here.',
            link: null,
          }

  return {
    showErr: !!err,
    errTitle: errKind === 'notfound' ? "No one's minted under this link." : "Couldn't load this profile.",
    errBody:
      errKind === 'notfound'
        ? 'This profile may have been deleted.'
        : 'Check your connection and try again.',
    retryLabel: 'Retry',
    retryButtonProps: { onClick: load },
    errorLinkLabel: 'Browse the marketplace',
    errorLinkProps: { to: '/marketplace' },
    showLoading: !err && !data,
    loadingLabel: 'Loading profile',
    profile: profile
      ? {
          name: profile.name,
          avatar: profile.picture
            ? {
                kind: 'image',
                imageProps: {
                  src: profile.picture,
                  alt: '',
                  width: 96,
                  height: 96,
                  loading: 'lazy',
                  referrerPolicy: 'no-referrer',
                  onError: avatarErrorHandler(profile.name),
                },
              }
            : { kind: 'initial', initial: firstGrapheme(profile.name) },
          stats: [
            { id: 'followers', glyph: '⭐', text: plural(profile.followers, 'follower') },
            { id: 'collection', glyph: '📚', text: `${profile.collectionSize} in collection` },
            { id: 'portfolio', glyph: '🧠', text: `portfolio ${profile.portfolioValue.toLocaleString()}` },
          ],
        }
      : null,
    showActions: !isSelf && !!user && !!profile,
    followButtonClassName: followingByMe ? '' : 'primary',
    followGlyph: followingByMe ? '★' : '☆',
    followText: busy ? (followingByMe ? 'Unfollowing…' : 'Following…') : followingByMe ? 'Following' : 'Follow',
    followButtonProps: {
      onClick: onToggleFollow,
      'aria-pressed': followingByMe,
      'aria-busy': busy,
      disabled: busy,
    },
    showFriendButton: friendStatus === null || friendStatus === 'incoming',
    friendGlyph: friendStatus === 'incoming' ? '✅' : '👋',
    friendText: busy
      ? friendStatus === 'incoming'
        ? 'Accepting…'
        : 'Sending…'
      : friendStatus === 'incoming'
        ? 'Accept request'
        : 'Add friend',
    friendButtonProps: { onClick: onFriendAction, 'aria-busy': busy, disabled: busy },
    showFriendChip: friendStatus === 'accepted' || friendStatus === 'outgoing',
    friendChipGlyph: friendStatus === 'accepted' ? '🤝' : '⏳',
    friendChipText: friendStatus === 'accepted' ? 'Friends' : 'Request sent',
    showActionErr: !!actionErr,
    actionErr: actionErr ?? '',
    showJoin: !user && !!profile,
    joinLabel: profile ? `Join MemeOn to collect ${profile.name}'s cards` : 'Join MemeOn to collect & trade',
    joinLinkProps: { to: '/', state: { next: pathname } },
    createdCount: data?.created.length ?? 0,
    binderCount: data?.binder.length ?? 0,
    cards: memes.map((meme) => ({
      id: `${tab}-${meme.id}`,
      memeCard: buildMemeCardModel(meme),
      sharesLabel: meme.shares === undefined ? null : `${meme.shares}/100 shares`,
    })),
    showEmpty: isEmpty,
    emptyTitle: emptyCopy.title,
    emptyBody: emptyCopy.body,
    showEmptyLink: !!emptyCopy.link,
    emptyLinkLabel: emptyCopy.link?.label ?? '',
    emptyLinkProps: { to: emptyCopy.link?.to ?? '/marketplace' },
    showGrid: !!data && memes.length > 0,
    ...buildProfileTabProps(tab, memes.length, (tab) => send({ type: 'SET_TAB', tab })),
  }
}
