import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Icon } from '../atoms/Icon'
import { cn } from '../lib/cn'
import { FOCUS_RING as FOCUS } from '../lib/focus'
import type { AppShellScreenModel } from '../hooks/useAppShellScreen'
import { AlertsBell } from '../molecules/AlertsBell'
import { AvatarMenu } from '../molecules/AvatarMenu'
import { QuestBar } from '../molecules/QuestBar'
import { ThemeControl } from '../molecules/ThemeControl'
import {
  AppShell,
  NAV_ROW,
  PRIMARY_PILL,
  TAB_ITEM,
  TAB_ITEM_PRIMARY,
  UTILITY_LINK,
} from '../organisms/AppShell'

/** The 22×22 icon lane every nav row shares, so labels line up whatever glyph sits in it. */
const ICON_LANE = 'inline-flex size-[22px] shrink-0 items-center justify-center'

/** The desktop header avatar is a link to the profile; the phone one opens the account menu. */
const AVATAR_LINK = cn('inline-flex shrink-0 rounded-avatar no-underline', FOCUS)

/** "🧠 2,480": a neutral raised pill at 900+; bare bold text in the phone cluster (the design's, and the only way it fits 350). */
const COINS = cn(
  'inline-flex h-[46px] shrink-0 items-center rounded-control bg-surface-raised px-[18px]',
  'text-label font-semibold whitespace-nowrap text-ink tabular-nums shadow-raised',
  'max-2xl:h-auto max-2xl:rounded-none max-2xl:bg-transparent max-2xl:px-0 max-2xl:font-bold max-2xl:shadow-none',
)

const GEAR_LINK = cn(
  'inline-flex size-[22px] shrink-0 items-center justify-center rounded-[8px] text-ink no-underline',
  'hover:text-ink-muted',
  'pointer-coarse:size-11',
  FOCUS,
)

const LOGOUT_LINK = cn(
  '-ml-3 inline-flex h-9 cursor-pointer items-center rounded-field border-0 bg-transparent px-3',
  'text-small font-medium text-ink-muted',
  '[transition:color_var(--dur-base)_ease] motion-reduce:transition-none',
  'hover:text-ink',
  'pointer-coarse:min-h-11',
  FOCUS,
)

/** App chrome as a function of its model. QuestBar, AlertsBell, ThemeControl and AvatarMenu take model props. */
export function AppShellScreen({
  children,
  showNav,
  showToolbar,
  navItems,
  mintLinkProps,
  utilityLinks,
  theme,
  contextLine,
  coins,
  avatar,
  identity,
  bottomNav,
  avatarMenu,
  alertsBell,
  questBar,
  logoutButtonProps,
}: AppShellScreenModel & { children: ReactNode }) {
  const sidebar = showNav ? (
    <>
      <nav className="mt-[38px] flex flex-col gap-[11px]" aria-label="Main" data-slot="sidebar-nav">
        {navItems.map((item) => (
          <Link key={item.to} to={item.to} className={NAV_ROW} aria-current={item.current ? 'page' : undefined}>
            <span className={ICON_LANE} aria-hidden="true" data-slot="nav-icon">
              {/* an emoji stays an emoji: it takes the icon lane instead of a drawn twin */}
              {item.emoji ? (
                <span className="text-[19px] leading-none">{item.emoji}</span>
              ) : (
                <Icon name={item.icon} size={22} />
              )}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link {...mintLinkProps} className={cn(PRIMARY_PILL, 'mx-1 mt-[43px]')} data-slot="mint-link">
        <span aria-hidden="true">＋</span> Mint a meme
      </Link>
      <div className="mt-auto flex flex-col pt-6" data-slot="sidebar-foot">
        <ThemeControl model={theme} className="mx-1" />
        <nav className="mx-3 mt-4 flex flex-col items-start gap-[5px]" aria-label="More" data-slot="utility-links">
          {utilityLinks.map((link) => (
            <Link key={link.to} to={link.to} className={UTILITY_LINK} aria-current={link.current ? 'page' : undefined}>
              {/* NBSP + space after the emoji so it does not glue to the word (plan-buckets › navigation-chrome) */}
              {link.emoji ? `${link.emoji}  ` : ''}
              {link.label}
            </Link>
          ))}
        </nav>
        {identity && (
          <div className="mx-1 mt-3 flex min-h-[55px] items-center gap-3" data-slot="identity">
            <Avatar name={identity.name} src={identity.src} size="md" className="rounded-avatar shadow-raised" />
            <span className="min-w-0 flex-1 truncate text-label font-semibold text-ink" data-slot="identity-name">
              {identity.name}
            </span>
            <Link {...identity.settingsLinkProps} className={GEAR_LINK} data-slot="identity-settings">
              <Icon name="gear" size={22} />
            </Link>
          </div>
        )}
        <button type="button" className={cn(LOGOUT_LINK, 'mx-3 self-start')} data-slot="logout" {...logoutButtonProps}>
          Log out
        </button>
      </div>
    </>
  ) : undefined

  const headerEnd = (
    <>
      {/* the sidebar carries the segmented control at 900+; the header button is the phone's and the public pages' */}
      <ThemeControl
        model={{ ...theme, variant: 'button' }}
        className={showNav ? '2xl:hidden' : '2xl:size-10 2xl:rounded-avatar 2xl:text-[18px]'}
      />
      {showToolbar && coins && (
        <span className={COINS} data-slot="coins">
          <span aria-hidden="true">{coins.text}</span>
          <span className="sr-only">{coins.label}</span>
        </span>
      )}
      {showToolbar && <AlertsBell model={alertsBell} />}
      {showToolbar && avatar && (
        <Link {...avatar.linkProps} className={cn(AVATAR_LINK, 'max-2xl:hidden')}>
          <Avatar name={avatar.name} src={avatar.src} size="md" className="rounded-avatar shadow-raised" />
        </Link>
      )}
      {showToolbar && avatarMenu && (
        <div className="inline-flex 2xl:hidden" data-slot="avatar-menu-slot">
          <AvatarMenu model={avatarMenu} />
        </div>
      )}
    </>
  )

  const tabs = showNav
    ? bottomNav.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(TAB_ITEM, item.primary && TAB_ITEM_PRIMARY)}
          aria-current={item.current ? 'page' : undefined}
          data-slot="tab-item"
          data-primary={item.primary || undefined}
        >
          <Icon name={item.icon} size={22} />
          {item.label}
        </Link>
      ))
    : undefined

  const quest = questBar ? <QuestBar model={questBar} /> : undefined

  return (
    <AppShell sidebar={sidebar} contextLine={contextLine} headerEnd={headerEnd} quest={quest} bottomNav={tabs}>
      {children}
    </AppShell>
  )
}
