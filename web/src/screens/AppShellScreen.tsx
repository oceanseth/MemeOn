import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/atoms/avatar'
import { buttonVariants } from '@/atoms/button'
import { Icon } from '@/atoms/icon'
import { cn } from '../lib/cn'
import type { AppShellScreenModel } from '../hooks/useAppShellScreen'
import { AlertsBell } from '@/molecules/alerts-bell'
import { AvatarMenu } from '@/molecules/avatar-menu'
import { QuestBar } from '@/molecules/quest-bar'
import { ThemeControl } from '@/molecules/theme-control'
import { AppShell } from '@/organisms/app-shell'
import { NavIcon, NavRow, TabItem, UtilityLink } from '@/organisms/nav-item'

/** The desktop header avatar is a link to the profile; the phone one opens the account menu. */
const AVATAR_LINK = cn('inline-flex shrink-0 rounded-md', 'focus-ring')

/** "🧠 2,480": a neutral raised pill at 900+; bare bold text in the phone cluster (the design's, and the only way it fits 350). */
const COINS = cn(
  'inline-flex h-control shrink-0 items-center rounded-lg material-raised px-4.5',
  'text-base font-semibold whitespace-nowrap text-foreground tabular-nums',
  'max-xl:h-auto max-xl:rounded-none max-xl:bg-transparent max-xl:px-0 max-xl:font-semibold max-xl:shadow-none',
)

const GEAR_LINK = cn(
  'inline-flex size-icon shrink-0 items-center justify-center rounded-xs text-foreground',
  'hover:text-muted-foreground',
  'pointer-coarse:size-hit',
  'focus-ring',
)

const LOGOUT_LINK = cn(
  '-ml-3 inline-flex h-9 cursor-pointer items-center rounded-md border-0 bg-transparent px-3',
  'text-sm font-medium text-muted-foreground',
  'transition-tint',
  'hover:text-foreground',
  'pointer-coarse:min-h-hit',
  'focus-ring',
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
      <nav className="mt-10 flex flex-col gap-3" aria-label="Main" data-slot="sidebar-nav">
        {navItems.map((item) => (
          <NavRow key={item.to} current={item.current} render={<Link to={item.to} />}>
            {/* an emoji stays an emoji: it takes the icon lane instead of a drawn twin */}
            <NavIcon>{item.emoji ? item.emoji : <Icon name={item.icon} size={22} />}</NavIcon>
            {item.label}
          </NavRow>
        ))}
      </nav>
      {/* the chrome's one primary, as a link: shadcn's "as link" form of the Button */}
      <Link
        {...mintLinkProps}
        className={cn(buttonVariants({ variant: 'primary' }), 'mx-1 mt-11')}
        data-slot="mint-link"
      >
        <span aria-hidden="true">＋</span> Mint a meme
      </Link>
      <div className="mt-auto flex flex-col pt-6" data-slot="sidebar-foot">
        <ThemeControl model={theme} className="mx-1" />
        <nav className="mx-3 mt-4 flex flex-col items-start gap-1" aria-label="More" data-slot="utility-links">
          {utilityLinks.map((link) => (
            <UtilityLink key={link.to} current={link.current} render={<Link to={link.to} />}>
              {/* NBSP after emoji so it does not glue to the label */}
              {link.emoji ? `${link.emoji}  ` : ''}
              {link.label}
            </UtilityLink>
          ))}
        </nav>
        {identity && (
          <div className="mx-1 mt-3 flex min-h-14 items-center gap-3" data-slot="identity">
            <Avatar name={identity.name} src={identity.src} size="md" />
            <span className="min-w-0 flex-1 truncate text-base font-semibold text-foreground" data-slot="identity-name">
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
      {/* the sidebar carries the segmented control at 900+; the header button is the phone's and
          the public pages' — and the public one grows past the cut, which is its own size */}
      <ThemeControl
        model={{ ...theme, variant: 'button' }}
        size={showNav ? 'sm' : 'lg'}
        className={showNav ? 'xl:hidden' : undefined}
      />
      {showToolbar && coins && (
        <span className={COINS} data-slot="coins">
          <span aria-hidden="true">{coins.text}</span>
          <span className="sr-only">{coins.label}</span>
        </span>
      )}
      {showToolbar && <AlertsBell model={alertsBell} />}
      {showToolbar && avatar && (
        <Link {...avatar.linkProps} className={cn(AVATAR_LINK, 'max-xl:hidden')}>
          <Avatar name={avatar.name} src={avatar.src} size="md" />
        </Link>
      )}
      {showToolbar && avatarMenu && (
        <div className="inline-flex xl:hidden" data-slot="avatar-menu-slot">
          <AvatarMenu model={avatarMenu} />
        </div>
      )}
    </>
  )

  const tabs = showNav
    ? bottomNav.map((item) => (
        <TabItem
          key={item.to}
          current={item.current}
          primary={item.primary}
          render={<Link to={item.to} />}
        >
          <Icon name={item.icon} size={22} />
          {item.label}
        </TabItem>
      ))
    : undefined

  const quest = questBar ? <QuestBar model={questBar} /> : undefined

  return (
    <AppShell sidebar={sidebar} contextLine={contextLine} headerEnd={headerEnd} quest={quest} bottomNav={tabs}>
      {children}
    </AppShell>
  )
}
