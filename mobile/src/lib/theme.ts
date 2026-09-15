import { useMemo } from 'react'
import { StyleSheet, useColorScheme } from 'react-native'

/**
 * Soft Press semantic colours for React Native.
 * Values are the sRGB hex arms of the `light-dark()` pairs in `web/src/index.css`
 * (`@theme static` block). Keep in sync when web tokens change.
 */
export type ThemeColors = {
  canvas: string
  canvasAlt: string
  surface: string
  surfaceRaised: string
  surfacePressed: string
  ink: string
  inkMuted: string
  line: string
  link: string
  focus: string
  action: string
  onAction: string
  actionSecondary: string
  onActionSecondary: string
  successSurface: string
  successText: string
  warningSurface: string
  warningText: string
  errorSurface: string
  errorText: string
  infoSurface: string
  infoText: string
}

export type ColorScheme = 'light' | 'dark'

/** Legacy aliases used by existing screens (`bg`, `accent`, …). */
export type LegacyColors = ThemeColors & {
  bg: string
  raised: string
  card: string
  border: string
  text: string
  dim: string
  accent: string
  gold: string
  danger: string
  ok: string
}

const light: ThemeColors = {
  canvas: '#f6f6fc',
  canvasAlt: '#ededf6',
  surface: '#fdfdff',
  surfaceRaised: '#f9fafe',
  surfacePressed: '#e5e5f1',
  ink: '#19182a',
  inkMuted: '#535366',
  line: '#cfcfde',
  link: '#5c26e1',
  focus: '#9f1c75',
  action: '#f99ad1',
  onAction: '#19182a',
  actionSecondary: '#b7b6f8',
  onActionSecondary: '#19182a',
  successSurface: '#c8f6d0',
  successText: '#084a20',
  warningSurface: '#fee9bd',
  warningText: '#633f08',
  errorSurface: '#fee4e3',
  errorText: '#901e21',
  infoSurface: '#ceeefe',
  infoText: '#094d71',
}

const dark: ThemeColors = {
  canvas: '#0e0e19',
  canvasAlt: '#151421',
  surface: '#1b1b29',
  surfaceRaised: '#252435',
  surfacePressed: '#07070f',
  ink: '#edeef5',
  inkMuted: '#b8b8ce',
  line: '#45455d',
  link: '#c5c4fa',
  focus: '#34b1ee',
  action: '#74c9f9',
  onAction: '#19182a',
  actionSecondary: '#b7b6f8',
  onActionSecondary: '#19182a',
  successSurface: '#093517',
  successText: '#93e4a4',
  warningSurface: '#3c2a03',
  warningText: '#f8ce73',
  errorSurface: '#4a1917',
  errorText: '#fdb6af',
  infoSurface: '#0a2c3e',
  infoText: '#9ad7fb',
}

export const tokens: Record<ColorScheme, ThemeColors> = { light, dark }

function withLegacy(palette: ThemeColors): LegacyColors {
  return {
    ...palette,
    bg: palette.canvas,
    raised: palette.surfaceRaised,
    card: palette.surface,
    border: palette.line,
    text: palette.ink,
    dim: palette.inkMuted,
    accent: palette.action,
    gold: palette.warningText,
    danger: palette.errorText,
    ok: palette.successText,
  }
}

export function getColors(scheme: ColorScheme | null | undefined = 'dark'): LegacyColors {
  return withLegacy(tokens[scheme === 'light' ? 'light' : 'dark'])
}

/** Resolves Soft Press tokens from the OS colour scheme (light/dark). */
export function useColors(): LegacyColors {
  const scheme = useColorScheme()
  return getColors(scheme === 'light' ? 'light' : 'dark')
}

/** Builds a StyleSheet from the current OS colour scheme. */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: LegacyColors) => T,
): T {
  const colors = useColors()
  return useMemo(() => StyleSheet.create(factory(colors)), [colors])
}

/**
 * Static dark snapshot for module-level `StyleSheet.create`.
 * Prefer `useColors()` inside components for light/dark correctness.
 */
export const colors = getColors('dark')
