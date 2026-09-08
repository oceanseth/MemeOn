import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import type { AppShellScreenModel } from '../hooks/useAppShellScreen'
import { AlertsBell } from '../molecules/AlertsBell'
import { QuestBar } from '../molecules/QuestBar'
import { AppShell } from '../organisms/AppShell'

/** App chrome as a function of its model. QuestBar and AlertsBell take model props. */
export function AppShellScreen({
  children,
  user,
  steps,
  packMemes,
  packReward,
  packBusy,
  alerts,
  alertsOpen,
  showNav,
  showToolbar,
  showAvatar,
  showQuest,
  coinsText,
  profileHref,
  bellRef,
  onLogout,
  onClaimPack,
  onDismissPack,
  onOpenAlerts,
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

  const toolbar = showToolbar && user ? (
    <>
      <span className="coins" title="Braincells">
        {coinsText}
      </span>
      <AlertsBell alerts={alerts} open={alertsOpen} onOpenChange={onOpenAlerts} rootRef={bellRef} />
      {showAvatar && user.picture && (
        <Link to={profileHref}>
          <img className="avatar" src={user.picture} alt={user.name} />
        </Link>
      )}
      <button onClick={onLogout}>Log out</button>
    </>
  ) : undefined

  const quest = showQuest ? (
    <QuestBar
      steps={steps ?? []}
      packMemes={packMemes}
      packReward={packReward}
      busy={packBusy}
      onClaimPack={onClaimPack}
      onDismissPack={onDismissPack}
    />
  ) : undefined

  return (
    <AppShell nav={nav} toolbar={toolbar} quest={quest}>
      {children}
    </AppShell>
  )
}
