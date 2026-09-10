import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { Button } from '../atoms/Button'
import { cn } from '../lib/cn'
import type { AppShellScreenModel } from '../hooks/useAppShellScreen'
import { AlertsBell } from '../molecules/AlertsBell'
import { QuestBar } from '../molecules/QuestBar'
import { AppShell, NAV_LINK, NAV_LINKS } from '../organisms/AppShell'

const AVATAR_LINK = cn(
  'inline-flex rounded-full',
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset)',
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[Highlight]',
)

/** App chrome as a function of its model. QuestBar and AlertsBell take model props. */
export function AppShellScreen({
  children,
  showNav,
  showToolbar,
  navItems,
  coins,
  avatar,
  alertsBell,
  questBar,
  logoutButtonProps,
}: AppShellScreenModel & { children: ReactNode }) {
  const nav = showNav ? (
    // data-slot="nav-links" is the shell's `--topbar-h` contract; see organisms/AppShell.css
    <nav className={NAV_LINKS} data-slot="nav-links">
      {navItems.map((item) => (
        /* a function className keeps react-router from appending its own `active` class: location
           already reaches the paint through the `aria-current` NavLink sets */
        <NavLink key={item.to} to={item.to} className={() => NAV_LINK}>
          {item.emoji ? `${item.emoji} ` : ''}
          {item.label}
        </NavLink>
      ))}
    </nav>
  ) : undefined

  const toolbar = showToolbar ? (
    <>
      {coins && (
        <span className="font-bold whitespace-nowrap text-gold tabular-nums" data-slot="coins">
          <span aria-hidden="true">{coins.text}</span>
          <span className="sr-only">{coins.label}</span>
        </span>
      )}
      <AlertsBell model={alertsBell} />
      {avatar && (
        <Link {...avatar.linkProps} className={AVATAR_LINK}>
          <Avatar name={avatar.name} src={avatar.src} size="sm" />
        </Link>
      )}
      <Button {...logoutButtonProps}>Log out</Button>
    </>
  ) : undefined

  const quest = questBar ? <QuestBar model={questBar} /> : undefined

  return (
    <AppShell nav={nav} toolbar={toolbar} quest={quest}>
      {children}
    </AppShell>
  )
}
