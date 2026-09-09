import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import type { AppShellScreenModel } from '../hooks/useAppShellScreen'
import { AlertsBell } from '../molecules/AlertsBell'
import { QuestBar } from '../molecules/QuestBar'
import { AppShell } from '../organisms/AppShell'

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
    <nav className="nav-links">
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to}>
          {item.emoji ? `${item.emoji} ` : ''}
          {item.label}
        </NavLink>
      ))}
    </nav>
  ) : undefined

  const toolbar = showToolbar ? (
    <>
      {coins && (
        <span className="coins">
          <span aria-hidden="true">{coins.text}</span>
          <span className="sr-only">{coins.label}</span>
        </span>
      )}
      <AlertsBell model={alertsBell} />
      {avatar && (
        <Link {...avatar.linkProps}>
          <img className="avatar" {...avatar.imageProps} />
        </Link>
      )}
      <button {...logoutButtonProps}>Log out</button>
    </>
  ) : undefined

  const quest = questBar ? <QuestBar model={questBar} /> : undefined

  return (
    <AppShell nav={nav} toolbar={toolbar} quest={quest}>
      {children}
    </AppShell>
  )
}
