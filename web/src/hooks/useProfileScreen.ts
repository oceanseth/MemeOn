import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import type { Meme } from '../lib/types'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'

export type ProfileTab = 'created' | 'binder'

export interface ProfileData {
  profile: {
    sub: string
    name: string
    picture: string | null
    followers: number
    collectionSize: number
    portfolioValue: number
  }
  followingByMe: boolean
  friendStatus: 'incoming' | 'outgoing' | 'accepted' | null
  created: Meme[]
  binder: (Meme & { shares: number })[]
}

export interface ProfileScreenModel {
  tab: ProfileTab
  err: string | null
  showErr: boolean
  showLoading: boolean
  profile: ProfileData['profile'] | null
  followingByMe: boolean
  friendStatus: ProfileData['friendStatus']
  isSelf: boolean
  showActions: boolean
  showJoin: boolean
  followPrimary: boolean
  followLabel: string
  friendLabel: string
  friendDisabled: boolean
  createdCount: number
  binderCount: number
  memes: (Meme & { shares?: number })[]
  showEmpty: boolean
  showGrid: boolean
  onTabChange: (tab: ProfileTab) => void
  onToggleFollow: () => void
  onFriendAction: () => void
}

/** Everything `ProfileScreen` renders. Tabs are controlled from initialTab; hook owns fetch. */
export function useProfileScreen({
  initialTab = 'created',
}: {
  initialTab?: ProfileTab
} = {}): ProfileScreenModel {
  const { sub } = useParams<{ sub: string }>()
  const { user } = useAuth()
  const [data, setData] = useState<ProfileData | null>(null)
  const [tab, setTab] = useState<ProfileTab>(initialTab)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!sub) return
    apiFetch<ProfileData>(`/api/users/${encodeURIComponent(sub)}/profile`)
      .then(setData)
      .catch(() => setErr('profile not found'))
  }, [sub])

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
    tab,
    err,
    showErr: !!err,
    showLoading: !err && !data,
    profile,
    followingByMe,
    friendStatus,
    isSelf,
    showActions: !isSelf && !!user && !!profile,
    showJoin: !user && !!profile,
    followPrimary: !followingByMe,
    followLabel: followingByMe ? '★ Following' : '☆ Follow',
    friendLabel,
    friendDisabled: friendStatus === 'accepted' || friendStatus === 'outgoing',
    createdCount: data?.created.length ?? 0,
    binderCount: data?.binder.length ?? 0,
    memes,
    showEmpty: !!data && memes.length === 0,
    showGrid: !!data && memes.length > 0,
    onTabChange: setTab,
    onToggleFollow,
    onFriendAction,
  }
}
