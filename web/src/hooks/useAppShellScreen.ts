import { useProjectedActor } from './useProjectedActor'
import { useCallback, type MouseEventHandler } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate, type LinkProps } from 'react-router-dom'
import type { IconName } from '@/atoms/icon'
import { appShellCopy } from '../copy/appShell'
import { buildAlertsBellModel, type AlertsBellModel } from '../lib/alertsBellModel'
import { apiFetch, post } from '../lib/api'
import { buildQuestBarModel, type QuestBarModel } from '../lib/questBarModel'
import type { Alert, Meme, Me, QuestKey, QuestStep } from '../lib/types'
import { withViewTransition } from '../lib/viewTransition'
import type { AvatarMenuModel } from '@/molecules/avatar-menu'
import type { ThemeControlModel } from '@/molecules/theme-control'
import { appShellMachine, type AppShellContext, type AppShellPhase } from '../stores/appShellMachine'
import { useStores } from '../stores/StoresContext'
import { useAuth } from './useAuth'
import { useMountEffect } from './useMountEffect'
import { useTheme } from './useTheme'

const POLL_MS = 30_000
const QUEST_KEYS: QuestKey[] = ['pack', 'mint', 'share', 'friend', 'trade']

const copy = appShellCopy

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

/**
 * What a chrome link spreads onto its `<Link>`: the route, and — from the live hook — the click
 * handler that runs the navigation inside a View Transition (`lib/viewTransition`). The pure
 * builder leaves `onClick` out, so a story's link is a plain router link.
 */
export type ShellLinkProps = Pick<LinkProps, 'to' | 'onClick'>

export interface ShellNavItem {
  to: string
  label: string
  /** The link's glyph, off `CHROME_ICONS` — every top-bar slot has one, so `null` is not a state. */
  icon: IconName
  current: boolean
  linkProps: ShellLinkProps
}

export interface ShellTabItem {
  to: string
  label: string
  icon: IconName
  current: boolean
  /** The centre Mint tab: the bar's single primary. */
  primary: boolean
  linkProps: ShellLinkProps
}

/**
 * Slot → glyph, restored. 8f07a8b shipped this map in the icon atom ("Sidebar 6UR-0 / bottom-nav
 * 767-0 slot → Central icon"); 9b1454b deleted it with no replacement and left the chrome's
 * glyphs as literals in arrays that promptly disagreed — every phone tab carried one while four
 * of the five top-bar links sat at `icon: null`, the account menu had nowhere to put one at all,
 * and `gear`, the design's own Settings glyph, went dead for want of a slot to live in. Keying it
 * on `RouteFamily` puts it on the union the chrome's active-state already runs on, so a route
 * cannot take a nav slot without a glyph decision being made about it in one visible place.
 *
 * `developers` and `discord` are `null` on purpose rather than simply absent: spelling them out
 * is what makes them a decision instead of an oversight. Both are text-only in the design, and
 * Discord's mark is a filled brand logo, not a 1.5 stroke glyph — the atom deliberately has no
 * brand state to draw it with (see the icon.tsx docblock).
 */
const CHROME_ICONS = {
  marketplace: 'storefront',
  binder: 'book',
  mint: 'circle-plus',
  friends: 'users',
  /* the open crossing arrows, not the rectangular repeat loop — `arrows-left-right` draws the
     shape reshares wore before the sweep, so reshare keeps it and Trade takes the swap. At 16px
     open-vs-closed is what the eye resolves first, long before it resolves arrowhead direction. */
  trade: 'arrows-swap',
  leaderboard: 'trophy',
  settings: 'gear',
  developers: null,
  discord: null,
} as const satisfies Record<RouteFamily, IconName | null>

/** The slots that carry a glyph; indexing `CHROME_ICONS` with one of these cannot be null. */
type GlyphSlot = Exclude<RouteFamily, 'developers' | 'discord'>

const NAV_ITEMS: { slot: GlyphSlot; families: RouteFamily[]; to: string; label: string }[] = [
  { slot: 'marketplace', families: ['marketplace'], to: '/marketplace', label: copy.nav.marketplace },
  { slot: 'binder', families: ['binder', 'mint'], to: '/binder', label: copy.nav.binder },
  { slot: 'friends', families: ['friends'], to: '/friends', label: copy.nav.friends },
  { slot: 'trade', families: ['trade'], to: '/trade', label: copy.nav.trade },
  { slot: 'leaderboard', families: ['leaderboard'], to: '/leaderboard', label: copy.nav.leaderboard },
]

/**
 * The account menu's routes: the chrome slots the top bar has no room for, read off the same map.
 * Profile is not here because it has no slot — `/u/:sub` is not a `RouteFamily` — and the set has
 * no single-person glyph to give it either (`users` is Friends' and would collide), so it stays
 * text in the menu the way Developers and Discord do by design.
 */
const MENU_ROUTES: { slot: RouteFamily; label: string; to: string }[] = [
  { slot: 'leaderboard', label: copy.accountMenu.leaderboard, to: '/leaderboard' },
  { slot: 'settings', label: copy.accountMenu.settings, to: '/settings' },
  { slot: 'developers', label: copy.accountMenu.developers, to: '/developers' },
  { slot: 'discord', label: copy.accountMenu.discord, to: '/discord' },
]

const MINT_TO = '/binder/new'

/** Phone tab bar; the labels are the 62px abbreviations. */
const TAB_ITEMS: { family: GlyphSlot; to: string; label: string; primary: boolean }[] = [
  { family: 'marketplace', to: '/marketplace', label: copy.tabs.market, primary: false },
  { family: 'binder', to: '/binder', label: copy.tabs.binder, primary: false },
  { family: 'mint', to: MINT_TO, label: copy.tabs.mint, primary: true },
  { family: 'friends', to: '/friends', label: copy.tabs.friends, primary: false },
  { family: 'trade', to: '/trade', label: copy.tabs.trade, primary: false },
]

function allDone(user: Me | null): boolean {
  return !!user && !!user.onboarding && QUEST_KEYS.every((k) => user.onboarding?.[k])
}

export interface AppShellScreenModel {
  phase: AppShellPhase
  showNav: boolean
  showToolbar: boolean
  /** The top bar's links, from the shell cut up; the tab bar carries the phone. */
  navItems: ShellNavItem[]
  /** The header's Mint: the chrome's one primary, a link wearing the pill. */
  mint: { label: string; linkProps: ShellLinkProps }
  /** Built off `useTheme()`: the public header's one-glyph button, and the account menu's radio. */
  theme: ThemeControlModel
  /**
   * The balance figure and the name it announces: a span takes no name from a title. While the
   * quest ladder is live the pill is `QuestBar`'s trigger and wears its ring.
   */
  coins: { text: string; label: string } | null
  bottomNav: ShellTabItem[]
  /**
   * The account menu behind the header avatar at every width: Profile · Top Brains · Settings
   * · Developers · Discord, the theme radio, Log out. Third-party avatar hosts 404, so the
   * trigger keeps its shape and stays *your* monogram, never the MemeOn mark.
   */
  avatarMenu: AvatarMenuModel | null
  alertsBell: AlertsBellModel
  questBar: QuestBarModel | null
}

export function buildAppShellScreenModel({
  phase,
  user,
  context,
  pathname = '/',
  theme = { value: 'auto', onChange: () => {} },
  onLogout,
  onClaimPack,
  onDismissPack,
  onOpenAlerts,
  onDismissQuests = () => {},
  onNavigate,
}: {
  phase: AppShellPhase
  user: Me | null
  context: AppShellContext
  /** The current route, for the chrome's `aria-current` marks. */
  pathname?: string
  theme?: Pick<ThemeControlModel, 'value' | 'onChange'>
  onLogout: () => void
  onClaimPack: () => void
  onDismissPack: () => void
  onOpenAlerts: (open: boolean) => void
  onDismissQuests?: () => void
  /** The live hook's click handler per route; absent, a chrome link is a plain router link. */
  onNavigate?: ((to: string) => MouseEventHandler<HTMLAnchorElement>) | undefined
}): AppShellScreenModel {
  const steps = context.questDismissed ? [] : context.steps ?? []
  const showQuest = (!!user && !allDone(user) && steps.length > 0) || !!context.packMemes
  const family = routeFamily(pathname, user?.sub ?? null)
  const profileTo = user ? `/u/${encodeURIComponent(user.sub)}` : '/'
  const link = (to: string): ShellLinkProps => (onNavigate ? { to, onClick: onNavigate(to) } : { to })

  return {
    phase,
    showNav: !!user,
    showToolbar: !!user,
    navItems: NAV_ITEMS.map(({ slot, families, ...item }) => ({
      ...item,
      icon: CHROME_ICONS[slot],
      current: family !== null && families.includes(family),
      linkProps: link(item.to),
    })),
    mint: { label: copy.mint, linkProps: link(MINT_TO) },
    theme: { value: theme.value, onChange: theme.onChange, variant: 'button' },
    coins: user
      ? {
          text: copy.coins.text(user.coins),
          label: copy.coins.label(user.coins),
        }
      : null,
    bottomNav: TAB_ITEMS.map(({ family: own, ...item }) => ({
      ...item,
      icon: CHROME_ICONS[own],
      current: family === own,
      linkProps: link(item.to),
    })),
    avatarMenu: user
      ? {
          name: user.name,
          src: user.picture,
          triggerProps: { 'aria-label': copy.accountMenu.trigger },
          /* your own profile, then the slots off the same map the bar and the tabs read, so a
             route wears one glyph wherever in the chrome it is reachable from */
          items: [
            { key: 'profile', label: copy.accountMenu.profile, to: profileTo, icon: null },
            ...MENU_ROUTES.map(({ slot, ...route }) => ({ key: slot, ...route, icon: CHROME_ICONS[slot] })),
          ],
          theme: { label: copy.accountMenu.theme, value: theme.value, onChange: theme.onChange },
          logOut: { label: copy.accountMenu.logOut, onSelect: onLogout },
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

    const onUserChange = () => {
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
    }
    onUserChange()
    const disposeUser = auth.subscribe(onUserChange)

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

  /*
   * A chrome link navigates inside a View Transition: the old frame is captured, the route swaps
   * synchronously, and the browser tweens between them (`organisms/app-shell.css` names what holds
   * still and what glides). A modified click or a non-primary button is the browser's — a new tab,
   * a context menu — so those fall through to the plain anchor. `BrowserRouter` has no data-router
   * `viewTransition` prop, which is why the hook wraps `navigate` itself.
   */
  const onNavigate = useCallback(
    (to: string): MouseEventHandler<HTMLAnchorElement> =>
      (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey
        )
          return
        event.preventDefault()
        withViewTransition(() => flushSync(() => navigate(to, { replace: to === pathname })))
      },
    [navigate, pathname],
  )

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
    onNavigate,
  })
}
