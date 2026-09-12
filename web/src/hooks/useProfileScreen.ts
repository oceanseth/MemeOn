import { useCallback } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ApiError, apiFetch, post } from '../lib/api'
import type { Meme } from '../lib/types'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { useProjectedActor } from './useProjectedActor'
import { BINDER_PAGE_SIZE } from '../stores/binderMachine'
import { profileMachine, type ProfileData, type ProfileTab } from '../stores/profileMachine'
import { buildMemeCardModel, type MemeCardModel } from '../lib/memeCardModel'
import type { ButtonVariant } from '../atoms/Button'
import type { ButtonHTMLAttributes } from 'react'
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
  /** the page title: the player's name, or "<name>'s binder" on a shared binder link */
  title: string
  /** the public boards' introduction under the title; null inside the app */
  intro: string | null
  /** the identity card's 24/30 line ("Binder of <name>"); null when the title already said it */
  identityLine: string | null
  /**
   * `/binder/:sub` seen by anyone but its owner. The Public Binder board (`HP9-0` › `HPP-0`) does
   * not box that identity: the 60px avatar rides inline beside the 44/55 title and the
   * introduction (`HPM-0`) sits under the whole row, so the screen composes a hero instead of the
   * title-then-card stack every other profile state draws.
   */
  showBinderHero: boolean
  profile: ProfileViewModel | null
  showActions: boolean
  tradeLabel: string
  tradeLinkProps: Pick<LinkProps, 'to' | 'aria-label'>
  shareLabel: string
  shareButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  showSelfActions: boolean
  settingsLabel: string
  settingsLinkProps: Pick<LinkProps, 'to'>
  followButtonVariant: ButtonVariant
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
  /** the public boards' closing line under the join CTA */
  reshareNote: string
  createdCount: number
  binderCount: number
  cards: readonly ProfileCardModel[]
  /** "Showing 6 of 12" — the phone board's grid count, kept for every width */
  gridCountLabel: string
  showMore: boolean
  showMoreLabel: string
  showMoreButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  showEmpty: boolean
  emptyTitle: string
  emptyBody: string
  showEmptyLink: boolean
  emptyLinkLabel: string
  emptyLinkProps: Pick<LinkProps, 'to'>
  showGrid: boolean
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

interface ProfileViewModel {
  name: string
  /** `<Avatar>` draws the monogram fallback itself whenever there is no picture. */
  avatarSrc: string | null
  stats: readonly ProfileStat[]
}

const CARDS_ID = 'profile-cards'

export function buildProfileTabProps(
  tab: ProfileTab,
  itemCount: number,
  onTabChange: (tab: ProfileTab) => void,
): Pick<
  ProfileScreenModel,
  'createdTabButtonProps' | 'binderTabButtonProps' | 'gridProps'
> {
  return {
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
  const { data, tab, err, errKind, busy, actionErr, visibleLimit } = snapshot.context

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

  /**
   * The share action the public boards put beside the identity (`HP9-0` › `LL7-0`): the platform
   * sheet when there is one, the clipboard otherwise. Read-only — it never mutates the account.
   */
  const onShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: profile ? `${profile.name} on MemeOn` : 'MemeOn', url }).catch(() => {})
      return
    }
    await navigator.clipboard?.writeText(url).catch(() => {})
  }, [profile])

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

  /** `/binder/:sub` for anyone but its owner: the Public Binder board, where the title is the binder. */
  const isPublicBinder = initialTab === 'binder' && !isSelf
  const createdCount = data?.created.length ?? 0
  const binderCount = data?.binder.length ?? 0
  const portfolio = profile?.portfolioValue.toLocaleString() ?? '0'
  const stats: ProfileStat[] = isPublicBinder
    ? [
        { id: 'minted', glyph: '', text: `${createdCount} minted` },
        { id: 'binder', glyph: '', text: `${binderCount} in binder` },
        { id: 'braincells', glyph: '🧠', text: `${portfolio} braincells` },
      ]
    : !user
      ? [{ id: 'braincells', glyph: '🧠', text: `${portfolio} braincells held` }]
      : [
          { id: 'collection', glyph: '📚', text: plural(profile?.collectionSize ?? 0, 'meme') },
          { id: 'portfolio', glyph: '🧠', text: `${portfolio} held` },
          { id: 'followers', glyph: '⭐', text: plural(profile?.followers ?? 0, 'follower') },
        ]
  const visible = memes.slice(0, visibleLimit)
  /* the friend button is the meaningful relationship move, so it takes the card's one bubblegum
     whenever it is on screen; follow steps back to the raised pill beside it (primary-action bucket) */
  const friendIsPrimary = friendStatus === null || friendStatus === 'incoming'

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
    title: isPublicBinder && profile ? `${profile.name}'s binder` : (profile?.name ?? ''),
    intro: isPublicBinder
      ? 'A collection worth passing around.'
      : !user && profile
        ? `A collection worth passing around · ${plural(createdCount, 'meme')} · ${binderCount} in binder`
        : null,
    identityLine: isPublicBinder || !user || !profile ? null : `Binder of ${profile.name}`,
    showBinderHero: isPublicBinder,
    profile: profile ? { name: profile.name, avatarSrc: profile.picture, stats } : null,
    showActions: !isSelf && !!user && !!profile,
    tradeLabel: 'Trade',
    tradeLinkProps: { to: '/trade', 'aria-label': `Trade with ${ownName}` },
    shareLabel: '🔗 Share binder',
    shareButtonProps: { onClick: onShare },
    showSelfActions: isSelf && !!profile,
    settingsLabel: 'Settings',
    settingsLinkProps: { to: '/settings' },
    followButtonVariant: friendIsPrimary || followingByMe ? 'default' : 'primary',
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
    joinLabel: isPublicBinder && profile
      ? `Log in to trade with ${profile.name}`
      : 'Log in to start your own binder',
    joinLinkProps: { to: '/', state: { next: pathname } },
    reshareNote: 'Every reshare of these links levels the cards up.',
    createdCount,
    binderCount,
    cards: visible.map((meme) => ({
      id: `${tab}-${meme.id}`,
      memeCard: buildMemeCardModel(meme),
      // the board's ownership copy: "holds N/100" on someone else's shelf, "N/100 shares" on yours
      sharesLabel:
        meme.shares === undefined ? null : isSelf ? `${meme.shares}/100 shares` : `holds ${meme.shares}/100`,
    })),
    gridCountLabel: `Showing ${visible.length} of ${memes.length}`,
    showMore: memes.length > visible.length,
    showMoreLabel: `Show ${Math.min(BINDER_PAGE_SIZE, memes.length - visible.length)} more`,
    showMoreButtonProps: { onClick: () => send({ type: 'SHOW_MORE' }) },
    showEmpty: isEmpty,
    emptyTitle: emptyCopy.title,
    emptyBody: emptyCopy.body,
    showEmptyLink: !!emptyCopy.link,
    emptyLinkLabel: emptyCopy.link?.label ?? '',
    emptyLinkProps: { to: emptyCopy.link?.to ?? '/marketplace' },
    showGrid: !!data && memes.length > 0,
    ...buildProfileTabProps(tab, visible.length, (tab) => send({ type: 'SET_TAB', tab })),
  }
}
