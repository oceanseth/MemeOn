import type { MouseEventHandler } from 'react'
import type { LinkProps } from 'react-router-dom'
import type { IconName } from '@/atoms/icon'
import { appShellCopy } from '../copy/appShell'
import { buildAlertsBellModel, type AlertsBellModel } from './alertsBellModel'
import { buildAppShellChrome, type AppShellChromeModel } from './appShellChromeModel'
import { buildQuestBarModel, type QuestBarModel } from './questBarModel'
import type { Me, QuestKey } from './types'
import type { AvatarMenuModel } from '@/molecules/avatar-menu'
import { buildThemeControlModel, type ThemeControlModel } from './themeControlModel'
import type { AppShellContext, AppShellPhase } from '../stores/appShellMachine'

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
  /** Hide this pill below 2xl; the account menu still carries the route. */
  hiddenUntil2xl?: boolean
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
 * Every slot now carries a glyph, so the type is `IconName` and `null` is not a state a route can
 * be left in. `developers` and `discord` were the two holes — they, plus Profile below, left three
 * of the account menu's five rows sitting in an empty icon lane, which is what a half-decorated
 * column looks like. `code` is Developers; `discord` is the brand mark the atom now draws filled
 * rather than stroked (see the icon.tsx docblock).
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
  developers: 'code',
  discord: 'discord',
} as const satisfies Record<RouteFamily, IconName>

/** Every chrome slot carries a glyph; the alias is kept so the item tables read as before. */
type GlyphSlot = RouteFamily

const NAV_ITEMS: {
  slot: GlyphSlot
  families: RouteFamily[]
  to: string
  label: string
  hiddenUntil2xl?: boolean
}[] = [
  { slot: 'marketplace', families: ['marketplace'], to: '/marketplace', label: copy.nav.marketplace },
  { slot: 'binder', families: ['binder', 'mint'], to: '/binder', label: copy.nav.binder },
  { slot: 'friends', families: ['friends'], to: '/friends', label: copy.nav.friends },
  { slot: 'trade', families: ['trade'], to: '/trade', label: copy.nav.trade },
  {
    slot: 'leaderboard',
    families: ['leaderboard'],
    to: '/leaderboard',
    label: copy.nav.leaderboard,
    hiddenUntil2xl: true,
  },
]

/**
 * The account menu's routes: the chrome slots the top bar has no room for, read off the same map.
 * Profile is not here because it has no slot — `/u/:sub` is not a `RouteFamily` — so the menu
 * gives it `user`, the single-person mark drawn for exactly this row (`users` is Friends' and
 * reusing it would collide).
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

export function allDone(user: Me | null): boolean {
  return !!user && !!user.onboarding && QUEST_KEYS.every((k) => user.onboarding?.[k])
}

export interface AppShellScreenModel {
  phase: AppShellPhase
  chrome: AppShellChromeModel
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
  braincells: { text: string; label: string } | null
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
  playVideos = { checked: true, onCheckedChange: () => {} },
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
  playVideos?: { checked: boolean; onCheckedChange: (checked: boolean) => void }
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
  const themeModel = buildThemeControlModel({
    value: theme.value,
    onChange: theme.onChange,
    variant: 'button',
  })

  return {
    phase,
    chrome: buildAppShellChrome(),
    showNav: !!user,
    showToolbar: !!user,
    navItems: NAV_ITEMS.map(({ slot, families, ...item }) => ({
      ...item,
      icon: CHROME_ICONS[slot],
      current: family !== null && families.includes(family),
      linkProps: link(item.to),
    })),
    mint: { label: copy.mint, linkProps: link(MINT_TO) },
    theme: themeModel,
    braincells: user
      ? {
          text: copy.braincells.text(user.coins),
          label: copy.braincells.label(user.coins),
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
            { key: 'profile', label: copy.accountMenu.profile, to: profileTo, icon: 'user' },
            ...MENU_ROUTES.map(({ slot, ...route }) => ({ key: slot, ...route, icon: CHROME_ICONS[slot] })),
          ],
          theme: {
            label: copy.accountMenu.theme,
            value: themeModel.value,
            onChange: themeModel.onChange,
            options: themeModel.options,
          },
          playVideos: {
            label: copy.accountMenu.playVideos,
            checked: playVideos.checked,
            onCheckedChange: playVideos.onCheckedChange,
          },
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
