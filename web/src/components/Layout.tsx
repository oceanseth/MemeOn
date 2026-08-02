import { useNavigate } from 'react-router-dom'
import { Layout as LayoutView } from '@memeon/ui'
import { useAuth } from '../context/AuthContext'
import { AlertsBell } from './AlertsBell'
import { QuestBar } from './QuestBar'
import type { ReactNode } from 'react'

/** Container: wires auth and navigation into the chrome. */
export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <LayoutView
      user={user ? { sub: user.sub, name: user.name, picture: user.picture, coins: user.coins } : null}
      alerts={<AlertsBell />}
      quests={<QuestBar />}
      onLogout={() => {
        logout()
        navigate('/')
      }}
    >
      {children}
    </LayoutView>
  )
}
