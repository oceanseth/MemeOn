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
 * The theme preference and the arm it resolves to, read straight off the bag's `ThemeStore`. Call
 * it from an `observer` view: the reads are MobX-tracked, so a change re-renders the caller.
 */
export function useTheme(): ThemeModel {
  const { theme } = useStores()
  return {
    preference: theme.preference,
    resolved: theme.resolved,
    setPreference: theme.setPreference,
  }
}
