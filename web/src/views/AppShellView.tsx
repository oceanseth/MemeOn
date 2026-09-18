import { observer } from 'mobx-react-lite'
import type { ReactNode } from 'react'
import { useAppShellScreen } from '../hooks/useAppShellScreen'
import { AppShellScreen } from '../screens/AppShellScreen'

export const AppShellView = observer(function AppShellView({ children }: { children: ReactNode }) {
  return <AppShellScreen {...useAppShellScreen()}>{children}</AppShellScreen>
})
