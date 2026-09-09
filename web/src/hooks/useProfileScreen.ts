import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
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
  err: string | null
  showErr: boolean
  showLoading: boolean
  profile: ProfileViewModel | null
  showActions: boolean
  showJoin: boolean
  followButtonClassName: string
  followLabel: string
  friendLabel: string
  createdCount: number
  binderCount: number
  cards: readonly ProfileCardModel[]
  showEmpty: boolean
  showGrid: boolean
  createdTabClassName: string
  binderTabClassName: string
  createdTabButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-pressed'>
  binderTabButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-pressed'>
  followButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-pressed'>
  friendButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>
  joinLinkProps: Pick<LinkProps, 'to'>
}

interface ProfileCardModel {
  id: string
  memeCard: MemeCardModel
  sharesLabel: string | null
}

interface ProfileViewModel {
  name: string
  hasPicture: boolean
  imageProps: Pick<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>
  statsLabel: string
}

export function buildProfileTabProps(
  tab: ProfileTab,
  onTabChange: (tab: ProfileTab) => void,
): Pick<ProfileScreenModel, 'createdTabClassName' | 'binderTabClassName' | 'createdTabButtonProps' | 'binderTabButtonProps'> {
  return {
    createdTabClassName: tab === 'created' ? 'primary' : '',
    binderTabClassName: tab === 'binder' ? 'primary' : '',
    createdTabButtonProps: { 'aria-pressed': tab === 'created', onClick: () => onTabChange('created') },
    binderTabButtonProps: { 'aria-pressed': tab === 'binder', onClick: () => onTabChange('binder') },
  }
}

/** Everything `ProfileScreen` renders. The route actor owns data, errors, and tabs. */
export function useProfileScreen({
  initialTab = 'created',
}: {
  initialTab?: ProfileTab
} = {}): ProfileScreenModel {
  const { sub } = useParams<{ sub: string }>()
  const { user } = useAuth()
  const [snapshot, send] = useProjectedActor(profileMachine, { input: { initialTab } })
  const { data, tab, err } = snapshot.context

  const load = useCallback(() => {
    if (!sub) return
    apiFetch<ProfileData>(`/api/users/${encodeURIComponent(sub)}/profile`)
      .then((data) => send({ type: 'DONE', data }))
      .catch(() => send({ type: 'FAIL', err: 'profile not found' }))
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

  const friendLabel =
    friendStatus === 'accepted'
      ? '🤝 Friends'
      : friendStatus === 'outgoing'
        ? '⏳ Requested'
        : friendStatus === 'incoming'
          ? '✅ Accept request'
          : '👋 Add friend'

  const onToggleFollow = useCallback(async () => {
    if (!profile) return
    await post(`/api/users/${encodeURIComponent(profile.sub)}/${followingByMe ? 'unfollow' : 'follow'}`, {}).catch(
      () => {},
    )
    load()
  }, [followingByMe, load, profile])

  const onFriendAction = useCallback(async () => {
    if (!profile) return
    if (friendStatus === null) await post('/api/friends/request', { userId: profile.sub }).catch(() => {})
    else if (friendStatus === 'incoming')
      await post('/api/friends/respond', { userId: profile.sub, accept: true }).catch(() => {})
    load()
  }, [friendStatus, load, profile])

  return {
    err,
    showErr: !!err,
    showLoading: !err && !data,
    profile: profile
      ? {
          name: profile.name,
          hasPicture: !!profile.picture,
          imageProps: { src: profile.picture ?? '', alt: profile.name },
          statsLabel: `⭐ ${profile.followers} followers · 📚 ${profile.collectionSize} memes · portfolio 🧠 ${profile.portfolioValue.toLocaleString()}`,
        }
      : null,
    showActions: !isSelf && !!user && !!profile,
    showJoin: !user && !!profile,
    followButtonClassName: followingByMe ? '' : 'primary',
    followLabel: followingByMe ? '★ Following' : '☆ Follow',
    friendLabel,
    createdCount: data?.created.length ?? 0,
    binderCount: data?.binder.length ?? 0,
    cards: memes.map((meme) => ({
      id: `${tab}-${meme.id}`,
      memeCard: buildMemeCardModel(meme),
      sharesLabel: meme.shares === undefined ? null : `${meme.shares}/100 shares`,
    })),
    showEmpty: !!data && memes.length === 0,
    showGrid: !!data && memes.length > 0,
    ...buildProfileTabProps(tab, (tab) => send({ type: 'SET_TAB', tab })),
    followButtonProps: { onClick: onToggleFollow, 'aria-pressed': followingByMe },
    friendButtonProps: {
      onClick: onFriendAction,
      disabled: friendStatus === 'accepted' || friendStatus === 'outgoing',
    },
    joinLinkProps: { to: '/' },
  }
}
