import type { IconName } from '@/atoms/icon'
import { sharedCopy } from '../copy/shared'
import type { ThemePreference } from '../stores/themeStore'

export interface ThemeOption {
  value: ThemePreference
  icon: IconName
  label: string
}

/**
 * What the theme control renders from. The hook builds it off `useTheme()`; `variant` picks the
 * Settings page's segmented well or the public header's one-glyph button. The account menu draws
 * the same three states as a radio from `options`.
 */
export interface ThemeControlModel {
  value: ThemePreference
  onChange: (preference: ThemePreference) => void
  variant: 'segmented' | 'button'
  options: readonly ThemeOption[]
  groupLabel: string
  cycleLabel: string
  nextValue: ThemePreference
}

/** The three states, in the order the button cycles them. Every glyph is a drawn Icon, and stays one. */
export const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'auto', icon: 'contrast', label: sharedCopy.theme.auto },
  { value: 'light', icon: 'sun', label: sharedCopy.theme.light },
  { value: 'dark', icon: 'moon', label: sharedCopy.theme.dark },
]

const optionFor = (value: ThemePreference) =>
  THEME_OPTIONS.find((option) => option.value === value) ?? THEME_OPTIONS[0]!

const nextAfter = (value: ThemePreference) =>
  THEME_OPTIONS[(THEME_OPTIONS.findIndex((option) => option.value === value) + 1) % THEME_OPTIONS.length]!

export function buildThemeControlModel({
  value,
  onChange,
  variant,
}: {
  value: ThemePreference
  onChange: (preference: ThemePreference) => void
  variant: ThemeControlModel['variant']
}): ThemeControlModel {
  const current = optionFor(value)
  const next = nextAfter(value)
  return {
    value,
    onChange,
    variant,
    options: THEME_OPTIONS,
    groupLabel: sharedCopy.theme.group,
    cycleLabel: sharedCopy.theme.cycle(current.label, next.label),
    nextValue: next.value,
  }
}
