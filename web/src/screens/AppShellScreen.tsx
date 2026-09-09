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
  coinsText,
  avatar,
  alertsBell,
  questBar,
  logoutButtonProps,
}: AppShellScreenModel & { children: ReactNode }) {
  const nav = showNav ? (
    <nav className="nav-links">
      <NavLink to="/marketplace">Marketplace</NavLink>
      <NavLink to="/binder">My Binder</NavLink>
      <NavLink to="/friends">Friends</NavLink>
      <NavLink to="/trade">Trade</NavLink>
      <NavLink to="/leaderboard">🏆 Top Brains</NavLink>
    </nav>
  ) : undefined

  const toolbar = showToolbar ? (
    <>
      <span className="coins" title="Braincells">
        {coinsText}
      </span>
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
