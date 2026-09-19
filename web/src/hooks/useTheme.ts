import { useSyncExternalStore } from 'react'
import { useStores } from '../stores/StoresContext'
import type { ResolvedTheme, ThemePreference } from '../stores/themeStore'

export interface ThemeModel {
  /** What the user chose: `auto` follows the OS. */
  preference: ThemePreference
  /** The arm in force right now — what a control marks as current. */
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

/**
 * The theme preference and the arm it resolves to, read from the bag's `ThemeStore` via
 * `useSyncExternalStore`. ThemeStore is not MobX.
 */
export function useTheme(): ThemeModel {
  const { theme } = useStores()
  const { preference, resolved } = useSyncExternalStore(theme.subscribe, theme.getSnapshot, theme.getSnapshot)
  return { preference, resolved, setPreference: theme.setPreference }
}
