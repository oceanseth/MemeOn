import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertsBell } from './AlertsBell'
import { QuestBar } from './QuestBar'
import type { ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="logo">
            <img src="/brand/memeon-logo-circle-64.png" alt="" className="logo-img" />
            MemeOn
          </Link>
          {user && (
            <nav className="nav-links">
              <NavLink to="/marketplace">Marketplace</NavLink>
              <NavLink to="/binder">My Binder</NavLink>
              <NavLink to="/friends">Friends</NavLink>
              <NavLink to="/trade">Trade</NavLink>
              <NavLink to="/leaderboard">🏆 Top Brains</NavLink>
            </nav>
          )}
          <div className="topbar-right">
            <Link to="/discord" title="MemeOn for Discord" className="discord-link" aria-label="MemeOn for Discord">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.6 1.25a18.3 18.3 0 0 0-5.5 0 12.6 12.6 0 0 0-.61-1.25.07.07 0 0 0-.08-.04c-1.71.3-3.35.81-4.88 1.52a.06.06 0 0 0-.03.02C.53 9.05-.32 13.58.1 18.06c0 .02.01.04.03.05a19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.12c.13-.1.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.3a.08.08 0 0 1-.01.12c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.1c.36.7.78 1.37 1.23 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6.02-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.68-3.55-13.67a.06.06 0 0 0-.03-.02ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
              </svg>
            </Link>
            {user ? (
              <>
                <span className="coins" title="Braincells">
                  🧠 {user.coins.toLocaleString()}
                </span>
                <AlertsBell />
                {user.picture && (
                  <Link to={`/u/${encodeURIComponent(user.sub)}`}>
                    <img className="avatar" src={user.picture} alt={user.name} />
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  Log out
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <QuestBar />
      {children}
      <footer className="site-footer">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/developers">Developers</a>
        <a href="/discord">Discord</a>
        <a href="/skill.md">API</a>
      </footer>
    </>
  )
}
