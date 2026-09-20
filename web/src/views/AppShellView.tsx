import type { ReactNode } from 'react'
import { useAppShellScreen } from '../hooks/useAppShellScreen'
import { AppShellScreen } from '../screens/AppShellScreen'

export function AppShellView({ children }: { children: ReactNode }) {
  return <AppShellScreen {...useAppShellScreen()}>{children}</AppShellScreen>
}
