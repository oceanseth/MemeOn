import { useCallback } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { profileCopy } from '../copy/profile'
import { ApiError, apiFetch, post } from '../lib/api'
import type { Meme } from '../lib/types'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { useProjectedActor } from './useProjectedActor'
import { BINDER_PAGE_SIZE } from '../stores/binderMachine'
import { profileMachine, type ProfileData, type ProfileTab } from '../stores/profileMachine'
import { buildMemeCardModel, type MemeCardModel } from '../lib/memeCardModel'
import type { ButtonVariant } from '@/atoms/button'
import type { IconName } from '@/atoms/icon'
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
  /** Route family for `document.title`: Profile vs Binder, not the fetched name. */
  documentTitle: string
  /** the page title: the player's name, or "<name>'s binder" on a shared binder link */
  title: string
  /** Public-profile intro under the title; null inside the app. */
  intro: string | null
  /** the identity card's 24/30 line ("Binder of <name>"); null when the title already said it */
  identityLine: string | null
  /** Public binder route: inline hero instead of title-then-card stack. */
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
  /** the toggle's state, drawn: `star` while you do not follow, `star-filled` once you do */
  followGlyph: IconName
  followText: string
  followButtonProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'aria-pressed' | 'aria-busy' | 'disabled'
  >
  showFriendButton: boolean
  friendGlyph: IconName | null
  friendText: string
  friendButtonProps: Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'aria-busy' | 'disabled'
  >
  showFriendChip: boolean
  friendChipGlyph: IconName | null
  friendChipText: string
  showActionErr: boolean
  actionErr: string
  showJoin: boolean
  joinLabel: string
  /** Identity-card CTA on a public profile; footer keeps `joinLabel`. */
  joinAddFriendLabel: string
  joinLinkProps: Pick<LinkProps, 'to' | 'state'>
  /** Closing line under the join CTA on public profiles. */
  reshareNote: string
  /** Accessible name for both relationship action groups. */
  actionsGroupLabel: string
  createdCount: number
  binderCount: number
  /** TabsList accessible name. */
  tabsListLabel: string
  createdTabLabel: string
  binderTabLabel: string
  cards: readonly ProfileCardModel[]
  /** Grid count label ("Showing 6 of 12"). */
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
  tabsProps: ProfileTabsProps
  gridProps: ProfileGridProps
}

/** Tabs + empty/grid/show-more for ProfileShelf, projected by ProfileScreen. */
export type ProfileShelfModel = Pick<
  ProfileScreenModel,
  | 'tabsListLabel'
  | 'createdTabLabel'
  | 'binderTabLabel'
  | 'cards'
  | 'gridCountLabel'
  | 'showMore'
  | 'showMoreLabel'
  | 'showMoreButtonProps'
  | 'showEmpty'
  | 'emptyTitle'
  | 'emptyBody'
  | 'showEmptyLink'
  | 'emptyLinkLabel'
  | 'emptyLinkProps'
  | 'showGrid'
  | 'tabsProps'
  | 'gridProps'
>

/** Tab-shaped, not button-shaped: `Tabs` owns `role="tab"`, `aria-selected` and the roving focus. */
interface ProfileTabsProps {
  value: ProfileTab
  onValueChange: (value: unknown) => void
}

/** The id both tabs control and the grid carries. */
export const PROFILE_CARDS_ID = 'profile-cards'

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
  /** the stat's drawn glyph (`IconName`), or null for a text-only stat */
  glyph: IconName | null
  text: string
}

interface ProfileViewModel {
  name: string
  /** `<Avatar>` draws the monogram fallback itself whenever there is no picture. */
  avatarSrc: string | null
  stats: readonly ProfileStat[]
}

const copy = profileCopy

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export function buildProfileTabProps(
  tab: ProfileTab,
  itemCount: number,
  onTabChange: (tab: ProfileTab) => void,
): Pick<ProfileScreenModel, 'tabsProps' | 'gridProps'> {
  return {
    tabsProps: {
      value: tab,
      onValueChange: (value) => onTabChange(value as ProfileTab),
    },
    gridProps: {
      id: PROFILE_CARDS_ID,
      'aria-live': 'polite',
      'aria-label': copy.grid.label(
        tab === 'created' ? copy.tabs.created : copy.tabs.binder,
        itemCount,
      ),
    },
  }
}

/** Everything `ProfileScreen` renders. The route actor owns data, errors, tabs and action state. */
export function useProfileScreen({
  initialTab = 'created',
}: {
  initialTab?: ProfileTab
} = {}): ProfileScreenModel {
  const { sub } = useParams<{ sub: string }>()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [snapshot, send] = useProjectedActor(profileMachine, {
    input: { initialTab },
  })
  const { data, tab, err, errKind, busy, actionErr, visibleLimit } = snapshot.context

  const load = useCallback(() => {
    if (!sub) return
    apiFetch<ProfileData>(`/api/users/${encodeURIComponent(sub)}/profile`)
      .then((data) => send({ type: 'DONE', data }))
      .catch((cause: unknown) =>
        send({
          type: 'FAIL',
          err: cause instanceof Error ? cause.message : copy.errors.loadFailed,
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
      await post(
        `/api/users/${encodeURIComponent(profile.sub)}/${following ? 'follow' : 'unfollow'}`,
        {},
      )
      send({ type: 'SET_FOLLOWING', following })
      send({ type: 'SETTLE_ACTION' })
      load()
    } catch {
      send({ type: 'FAIL_ACTION', err: copy.errors.update })
    }
  }, [busy, followingByMe, load, profile, send])

  const onFriendAction = useCallback(async () => {
    if (!profile || busy) return
    if (friendStatus !== null && friendStatus !== 'incoming') return
    send({ type: 'BEGIN_ACTION' })
    try {
      if (friendStatus === null) await post('/api/friends/request', { userId: profile.sub })
      else
        await post('/api/friends/respond', {
          userId: profile.sub,
          accept: true,
        })
      send({ type: 'SETTLE_ACTION' })
      load()
    } catch {
      send({ type: 'FAIL_ACTION', err: copy.errors.update })
    }
  }, [busy, friendStatus, load, profile, send])

  /** Share via platform sheet when available, else clipboard. AbortError is a dismissed sheet. */
  const onShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile ? copy.share.title(profile.name) : copy.share.fallbackTitle,
          url,
        })
        return
      } catch (error) {
        if (isAbortError(error)) return
      }
    }
    if (!navigator.clipboard?.writeText) {
      send({ type: 'FAIL_ACTION', err: copy.errors.copy })
      return
    }
    try {
      // called on navigator.clipboard: a detached writeText rejects with Illegal invocation
      await navigator.clipboard.writeText(url)
    } catch {
      send({ type: 'FAIL_ACTION', err: copy.errors.copy })
    }
  }, [profile, send])

  const isEmpty = !!data && memes.length === 0
  const ownName = profile?.name ?? copy.fallbackName
  const emptyCopy = !isEmpty
    ? { title: '', body: '', link: null }
    : isSelf
      ? tab === 'created'
        ? {
            title: copy.empty.self.created.title,
            body: copy.empty.self.created.body,
            link: { label: copy.empty.self.created.link, to: '/binder/new' },
          }
        : {
            title: copy.empty.self.binder.title,
            body: copy.empty.self.binder.body,
            link: { label: copy.empty.self.binder.link, to: '/marketplace' },
          }
      : tab === 'created'
        ? {
            title: copy.empty.other.created.title(ownName),
            body: copy.empty.other.created.body,
            link: null,
          }
        : {
            title: copy.empty.other.binder.title(ownName),
            body: copy.empty.other.binder.body,
            link: null,
          }

  /** Public binder viewed by someone other than the owner. */
  const isPublicBinder = initialTab === 'binder' && !isSelf
  const createdCount = data?.created.length ?? 0
  const binderCount = data?.binder.length ?? 0
  const portfolio = profile?.portfolioValue ?? 0
  const stats: ProfileStat[] = isPublicBinder
    ? [
        { id: 'minted', glyph: null, text: copy.stats.minted(createdCount) },
        { id: 'binder', glyph: null, text: copy.stats.inBinder(binderCount) },
        {
          id: 'braincells',
          glyph: 'brain',
          text: copy.stats.braincells(portfolio),
        },
      ]
    : !user
      ? [
          {
            id: 'braincells',
            glyph: 'brain',
            text: copy.stats.braincellsHeld(portfolio),
          },
        ]
      : [
          {
            id: 'collection',
            glyph: 'book',
            text: copy.stats.collection(profile?.collectionSize ?? 0),
          },
          { id: 'portfolio', glyph: 'brain', text: copy.stats.held(portfolio) },
          {
            id: 'followers',
            glyph: 'star',
            text: copy.stats.followers(profile?.followers ?? 0),
          },
        ]
  const visible = memes.slice(0, visibleLimit)
  /* the friend button is the meaningful relationship move, so it takes the card's one bubblegum
     whenever it is on screen; follow steps back to the raised pill beside it (primary-action bucket) */
  const friendIsPrimary = friendStatus === null || friendStatus === 'incoming'

  return {
    showErr: !!err,
    errTitle:
      errKind === 'notfound' ? copy.loadError.notFound.title : copy.loadError.transport.title,
    errBody: errKind === 'notfound' ? copy.loadError.notFound.body : copy.loadError.transport.body,
    retryLabel: copy.loadError.retry,
    retryButtonProps: { onClick: load },
    errorLinkLabel: copy.loadError.browse,
    errorLinkProps: { to: '/marketplace' },
    showLoading: !err && !data,
    loadingLabel: copy.loading,
    documentTitle: initialTab === 'binder' ? copy.documentTitle.binder : copy.documentTitle.profile,
    title: isPublicBinder && profile ? copy.hero.binderTitle(profile.name) : (profile?.name ?? ''),
    intro: isPublicBinder
      ? copy.hero.publicIntro
      : !user && profile
        ? copy.hero.visitorIntro(createdCount, binderCount)
        : null,
    identityLine: isPublicBinder || !user || !profile ? null : copy.hero.identity(profile.name),
    showBinderHero: isPublicBinder,
    profile: profile ? { name: profile.name, avatarSrc: profile.picture, stats } : null,
    showActions: !isSelf && !!user && !!profile,
    tradeLabel: copy.actions.trade,
    tradeLinkProps: {
      to: '/trade',
      'aria-label': copy.actions.tradeWith(ownName),
    },
    shareLabel: copy.actions.share,
    shareButtonProps: { onClick: onShare },
    showSelfActions: isSelf && !!profile,
    settingsLabel: copy.actions.settings,
    settingsLinkProps: { to: '/settings' },
    followButtonVariant: friendIsPrimary || followingByMe ? 'default' : 'primary',
    /* was copy.actions.follow.glyph/glyphOn, a raw ☆/★ pair the emoji sweep never reached
       because it lived in copy rather than in markup; `star-filled` shares `star`'s exact contour,
       so following darkens the star in place instead of resizing the button */
    followGlyph: followingByMe ? 'star-filled' : 'star',
    followText: busy
      ? followingByMe
        ? copy.actions.follow.busyOn
        : copy.actions.follow.busy
      : followingByMe
        ? copy.actions.follow.labelOn
        : copy.actions.follow.label,
    followButtonProps: {
      onClick: onToggleFollow,
      'aria-pressed': followingByMe,
      'aria-busy': busy,
      disabled: busy,
    },
    showFriendButton: friendStatus === null || friendStatus === 'incoming',
    friendGlyph: friendStatus === 'incoming' ? 'circle-check' : 'hand',
    friendText: busy
      ? friendStatus === 'incoming'
        ? copy.actions.friend.accepting
        : copy.actions.friend.adding
      : friendStatus === 'incoming'
        ? copy.actions.friend.accept
        : copy.actions.friend.add,
    friendButtonProps: {
      onClick: onFriendAction,
      'aria-busy': busy,
      disabled: busy,
    },
    showFriendChip: friendStatus === 'accepted' || friendStatus === 'outgoing',
    friendChipGlyph: friendStatus === 'accepted' ? 'handshake' : 'hourglass',
    friendChipText:
      friendStatus === 'accepted'
        ? copy.actions.friendChip.friends
        : copy.actions.friendChip.pending,
    showActionErr: !!actionErr,
    actionErr: actionErr ?? '',
    showJoin: !user && !!profile,
    joinLabel: isPublicBinder && profile ? copy.join.trade(profile.name) : copy.join.binder,
    joinAddFriendLabel: copy.join.addFriend,
    joinLinkProps: { to: '/', state: { next: pathname } },
    reshareNote: copy.join.reshareNote,
    actionsGroupLabel: copy.actions.groupLabel,
    createdCount,
    binderCount,
    tabsListLabel: copy.tabs.section,
    createdTabLabel: copy.tabs.trigger(copy.tabs.created, createdCount),
    binderTabLabel: copy.tabs.trigger(copy.tabs.binder, binderCount),
    cards: visible.map((meme) => ({
      id: `${tab}-${meme.id}`,
      memeCard: buildMemeCardModel(meme),
      // "holds N/100" on others' binders, "N/100 shares" on yours
      sharesLabel:
        meme.shares === undefined
          ? null
          : isSelf
            ? copy.cards.yourShares(meme.shares)
            : copy.cards.holds(meme.shares),
    })),
    gridCountLabel: copy.grid.count(visible.length, memes.length),
    showMore: memes.length > visible.length,
    showMoreLabel: copy.grid.showMore(Math.min(BINDER_PAGE_SIZE, memes.length - visible.length)),
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
