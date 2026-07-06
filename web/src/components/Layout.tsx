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
          <Link to={user ? '/marketplace' : '/'} className="logo">
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
    </>
  )
}
