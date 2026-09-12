import { useProjectedActor } from './useProjectedActor'
import { autorun } from 'mobx'
import { useCallback, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react'
import { useLocation, useNavigate, type LinkProps } from 'react-router-dom'
import type { IconName } from '../atoms/Icon'
import { buildAlertsBellModel, type AlertsBellModel } from '../lib/alertsBellModel'
import { apiFetch, post } from '../lib/api'
import { buildQuestBarModel, type QuestBarModel } from '../lib/questBarModel'
import type { Alert, Meme, Me, QuestKey, QuestStep } from '../lib/types'
import type { AvatarMenuModel } from '../molecules/AvatarMenu'
import type { ThemeControlModel } from '../molecules/ThemeControl'
import { appShellMachine, type AppShellContext, type AppShellPhase } from '../stores/appShellMachine'
import { useStores } from '../stores/StoresContext'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { useTheme } from './useTheme'

const POLL_MS = 30_000
const QUEST_KEYS: QuestKey[] = ['pack', 'mint', 'share', 'friend', 'trade']

/** Header tagline on signed-in routes. */
const TAGLINE = 'the meme trading card market'

/** Route family for chrome active-state; mint is separate for the phone tab bar. */
export type RouteFamily =
  | 'marketplace'
  | 'binder'
  | 'mint'
  | 'friends'
  | 'trade'
  | 'leaderboard'
  | 'settings'
  | 'developers'
  | 'discord'

export function routeFamily(pathname: string, sub: string | null): RouteFamily | null {
  if (pathname === '/marketplace' || pathname.startsWith('/m/') || pathname.startsWith('/meme/')) return 'marketplace'
  if (pathname === '/binder/new') return 'mint'
  if (pathname === '/binder' || (sub !== null && pathname === `/binder/${encodeURIComponent(sub)}`)) return 'binder'
  if (pathname === '/friends') return 'friends'
  if (pathname === '/trade') return 'trade'
  if (pathname === '/leaderboard') return 'leaderboard'
  if (pathname === '/settings' || pathname.startsWith('/settings/')) return 'settings'
  if (pathname === '/developers') return 'developers'
  if (pathname === '/discord' || pathname.startsWith('/discord/')) return 'discord'
  return null
}

export interface ShellNavItem {
  to: string
  label: string
  /** An emoji that is the row's glyph. It stays an emoji: it takes the icon lane, never a drawn twin. */
  emoji: string | null
  icon: IconName
  current: boolean
}

export interface ShellUtilityLink {
  to: string
  label: string
  emoji: string | null
  current: boolean
}

export interface ShellTabItem {
  to: string
  label: string
  icon: IconName
  current: boolean
  /** The centre Mint tab: the bar's single primary. */
  primary: boolean
}

export interface ShellIdentity {
  name: string
  src: string | null
  settingsLinkProps: Pick<LinkProps, 'to'> & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'aria-label'>
}

const NAV_ITEMS: { families: RouteFamily[]; to: string; label: string; emoji: string | null; icon: IconName }[] = [
  { families: ['marketplace'], to: '/marketplace', label: 'Marketplace', emoji: null, icon: 'storefront' },
  { families: ['binder', 'mint'], to: '/binder', label: 'My Binder', emoji: null, icon: 'book' },
  { families: ['friends'], to: '/friends', label: 'Friends', emoji: null, icon: 'users' },
  { families: ['trade'], to: '/trade', label: 'Trade', emoji: null, icon: 'arrows-left-right' },
  { families: ['leaderboard'], to: '/leaderboard', label: 'Top Brains', emoji: '🏆', icon: 'trophy' },
]

const UTILITY_LINKS: { family: RouteFamily; to: string; label: string; emoji: string | null }[] = [
  { family: 'discord', to: '/discord', label: 'Discord', emoji: null },
  { family: 'developers', to: '/developers', label: 'Developers', emoji: '🔧' },
  { family: 'settings', to: '/settings', label: 'Settings', emoji: null },
]

/** Phone tab bar; 'Market' is the 62px abbreviation of Marketplace. */
const TAB_ITEMS: { family: RouteFamily; to: string; label: string; icon: IconName; primary: boolean }[] = [
  { family: 'marketplace', to: '/marketplace', label: 'Market', icon: 'storefront', primary: false },
  { family: 'binder', to: '/binder', label: 'Binder', icon: 'book', primary: false },
  { family: 'mint', to: '/binder/new', label: 'Mint', icon: 'circle-plus', primary: true },
  { family: 'friends', to: '/friends', label: 'Friends', icon: 'users', primary: false },
  { family: 'trade', to: '/trade', label: 'Trade', icon: 'arrows-left-right', primary: false },
]

function allDone(user: Me | null): boolean {
  return !!user && !!user.onboarding && QUEST_KEYS.every((k) => user.onboarding?.[k])
}

export interface AppShellScreenModel {
  phase: AppShellPhase
  showNav: boolean
  showToolbar: boolean
  navItems: ShellNavItem[]
  /** The sidebar's Mint pill: the chrome's one primary. */
  mintLinkProps: Pick<LinkProps, 'to'>
  utilityLinks: ShellUtilityLink[]
  /** Built off `useTheme()`; the screen re-variants it for the header button. */
  theme: ThemeControlModel
  /** Desktop header, left. Empty renders nothing. */
  contextLine: string
  /** The balance figure and the name it announces: a span takes no name from a title. */
  coins: { text: string; label: string } | null
  avatar: {
    linkProps: Pick<LinkProps, 'to'> & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'aria-label'>
    /* third-party avatar hosts 404: the slot keeps its shape and stays *your* monogram,
       never the MemeOn mark, which is a different identity in the same disc */
    name: string
    src: string | null
  } | null
  /** The sidebar's identity row: avatar, name, the gear to Settings. */
  identity: ShellIdentity | null
  bottomNav: ShellTabItem[]
  /** The phone header's account menu (Profile, Top Brains, Settings, Developers, Log out). */
  avatarMenu: AvatarMenuModel | null
  alertsBell: AlertsBellModel
  questBar: QuestBarModel | null
  logoutButtonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label'>
}

export function buildAppShellScreenModel({
  phase,
  user,
  context,
  pathname = '/',
  theme = { value: 'auto', onChange: () => {} },
  contextLine = TAGLINE,
  onLogout,
  onClaimPack,
  onDismissPack,
  onOpenAlerts,
  onDismissQuests = () => {},
}: {
  phase: AppShellPhase
  user: Me | null
  context: AppShellContext
  /** The current route, for the chrome's `aria-current` marks. */
  pathname?: string
  theme?: Pick<ThemeControlModel, 'value' | 'onChange'>
  contextLine?: string
  onLogout: () => void
  onClaimPack: () => void
  onDismissPack: () => void
  onOpenAlerts: (open: boolean) => void
  onDismissQuests?: () => void
}): AppShellScreenModel {
  const steps = context.questDismissed ? [] : context.steps ?? []
  const showQuest = (!!user && !allDone(user) && steps.length > 0) || !!context.packMemes
  const family = routeFamily(pathname, user?.sub ?? null)
  const profileTo = user ? `/u/${encodeURIComponent(user.sub)}` : '/'

  return {
    phase,
    showNav: !!user,
    showToolbar: !!user,
    navItems: NAV_ITEMS.map(({ families, ...item }) => ({
      ...item,
      current: family !== null && families.includes(family),
    })),
    mintLinkProps: { to: '/binder/new' },
    utilityLinks: UTILITY_LINKS.map(({ family: own, ...link }) => ({ ...link, current: family === own })),
    theme: { value: theme.value, onChange: theme.onChange, variant: 'segmented' },
    contextLine,
    coins: user
      ? {
          text: `🧠 ${user.coins.toLocaleString()}`,
          label: `${user.coins.toLocaleString()} braincells`,
        }
      : null,
    avatar: user
      ? {
          linkProps: { to: profileTo, 'aria-label': 'Your profile' },
          name: user.name,
          src: user.picture,
        }
      : null,
    identity: user
      ? {
          name: user.name,
          src: user.picture,
          settingsLinkProps: { to: '/settings', 'aria-label': 'Settings' },
        }
      : null,
    bottomNav: TAB_ITEMS.map(({ family: own, ...item }) => ({ ...item, current: family === own })),
    avatarMenu: user
      ? {
          name: user.name,
          src: user.picture,
          triggerProps: { 'aria-label': 'Account menu' },
          items: [
            { key: 'profile', label: 'Profile', to: profileTo },
            { key: 'leaderboard', label: '🏆 Top Brains', to: '/leaderboard' },
            { key: 'settings', label: 'Settings', to: '/settings' },
            { key: 'developers', label: '🔧 Developers', to: '/developers' },
            { key: 'logout', label: 'Log out', onSelect: onLogout },
          ],
        }
      : null,
    alertsBell: buildAlertsBellModel({
      alerts: context.alerts,
      open: context.alertsOpen,
      onOpenChange: onOpenAlerts,
      wasUnread: context.wasUnread,
      failed: context.alertsError,
    }),
    questBar: showQuest ? buildQuestBarModel({
      steps,
      packMemes: context.packMemes,
      packReward: context.packReward,
      busy: context.packBusy,
      claimError: context.claimError,
      onClaimPack,
      onDismissPack,
      onDismissSteps: onDismissQuests,
    }) : null,
    logoutButtonProps: { onClick: onLogout, 'aria-label': 'Log out' },
  }
}

/** Everything `AppShellScreen` renders. The hook is the engine; the screen is the terminal. */
export function useAppShellScreen(): AppShellScreenModel {
  const { user, logout, refresh } = useAuth()
  const { auth } = useStores()
  const { preference, setPreference } = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [snapshot, send, actor] = useProjectedActor(appShellMachine)
  const ctx = snapshot.context
  const phase = snapshot.value as AppShellPhase

  useMountEffect(() => {
    let lastUser: Me | null | undefined
    let disposeLoads = () => {}
    let refetchOnVisible = () => {}

    const disposeUser = autorun(() => {
      const next = auth.user
      const done = allDone(next)
      if (next === lastUser) return
      lastUser = next
      disposeLoads()
      if (!next) {
        send({ type: 'LOGGED_OUT' })
        return
      }
      let live = true
      let poll: ReturnType<typeof setInterval> | null = null
      const loadAlerts = () => {
        if (!live) return
        void apiFetch<{ alerts: Alert[] }>('/api/alerts')
          .then((r) => { if (live) send({ type: 'SET_ALERTS', alerts: r.alerts }) })
          .catch(() => { if (live) send({ type: 'SET_ALERTS_FAIL' }) })
      }
      const loadSteps = () => {
        if (!live) return
        void apiFetch<{ steps: QuestStep[] }>('/api/onboarding')
          .then((r) => { if (live) send({ type: 'SET_STEPS', steps: r.steps }) })
          .catch(() => {})
      }
      /* a hidden tab is not a reader: skip its ticks and catch up when it comes back */
      refetchOnVisible = () => { if (document.visibilityState === 'visible') loadAlerts() }
      disposeLoads = () => {
        live = false
        refetchOnVisible = () => {}
        if (poll) clearInterval(poll)
        poll = null
      }
      send({ type: 'LOGGED_IN' })
      loadAlerts()
      if (!done) loadSteps()
      poll = setInterval(() => {
        if (document.visibilityState === 'visible') loadAlerts()
      }, POLL_MS)
    })

    const onVisibility = () => refetchOnVisible()
    document.addEventListener('visibilitychange', onVisibility)

    /* Base UI's Popover owns dismissal now — an outside press, Escape and a focus-out all arrive
       through `onOpenChange`, so the shell no longer watches the document for stray clicks. */
    return () => {
      disposeUser()
      disposeLoads()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  })

  const onClaimPack = useCallback(async () => {
    send({ type: 'CLAIM_START' })
    try {
      const out = await post<{ memes: Meme[]; reward: number }>('/api/onboarding/claim-pack', {})
      send({ type: 'CLAIM_DONE', memes: out.memes, reward: out.reward })
      void refresh()
    } catch {
      send({ type: 'CLAIM_FAIL' })
    }
  }, [refresh, send])

  const onOpenAlerts = useCallback(
    async (next: boolean) => {
      send({ type: next ? 'OPEN_ALERTS' : 'CLOSE_ALERTS' })
      const unread = actor.getSnapshot().context.alerts.filter((a) => !a.read)
      if (next && unread.length > 0) {
        const ids = unread.map((a) => a.id)
        await post('/api/alerts/read', { ids }).catch(() => {})
        /* the ids stay marked in this session so the gesture that reveals them does not erase them */
        send({ type: 'MARK_READ', ids })
        void refresh()
      }
    },
    [actor, refresh, send],
  )

  const onLogout = useCallback(() => {
    logout()
    navigate('/')
  }, [logout, navigate])

  return buildAppShellScreenModel({
    phase,
    user,
    context: ctx,
    pathname,
    theme: { value: preference, onChange: setPreference },
    onLogout,
    onClaimPack: () => void onClaimPack(),
    onDismissPack: () => send({ type: 'DISMISS_PACK' }),
    onOpenAlerts: (open) => void onOpenAlerts(open),
    onDismissQuests: () => send({ type: 'DISMISS_QUESTS' }),
  })
}
