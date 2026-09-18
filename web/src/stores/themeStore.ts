import { action, actionBound, computed, makeObservable, observable } from 'mobx'

export type ThemePreference = 'auto' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

/** The device key: the logged-out chrome's choice, and the fallback for an avatar that has none. */
export const THEME_STORAGE_KEY = 'memeon_theme'

/** Where a preference is persisted: per avatar when signed in, the device key otherwise. */
export const themeStorageKey = (sub: string | null): string =>
  sub ? `${THEME_STORAGE_KEY}:${sub}` : THEME_STORAGE_KEY

const PREFERENCES: readonly ThemePreference[] = ['auto', 'light', 'dark']
const isPreference = (value: unknown): value is ThemePreference =>
  PREFERENCES.includes(value as ThemePreference)

const DARK_QUERY = '(prefers-color-scheme: dark)'

interface MediaQuery {
  readonly matches: boolean
  addEventListener(type: 'change', listener: (event: { matches: boolean }) => void): void
  removeEventListener(type: 'change', listener: (event: { matches: boolean }) => void): void
}

/**
 * The slice of `window` the store touches. Every member is optional: node (the unit project) hands
 * it nothing and every call is a no-op; tests hand it fakes; the app hands it `window`.
 */
export interface ThemeHost {
  readonly document?: { readonly documentElement: { readonly dataset: Record<string, string | undefined> } }
  readonly localStorage?: Pick<Storage, 'getItem' | 'setItem'>
  readonly matchMedia?: (query: string) => MediaQuery
}

const defaultHost = (): ThemeHost => (typeof window === 'undefined' ? {} : window)

/**
 * The theme preference (`auto` follows the OS) and the arm it resolves to. Construction is inert:
 * nothing is read from storage or written to `<html>` until `apply()` (the sync pre-render paint
 * `main.tsx` does), `connect()` (the bag's `retain()`, which also starts following the OS setting)
 * or `bindUser()` (the bag's reaction on the signed-in avatar). `resolved` is what a control shows
 * as current; `data-theme` on `<html>` is what `index.css` pins its `color-scheme` to.
 */
export class ThemeStore {
  preference: ThemePreference = 'auto'
  private systemDark = false
  private sub: string | null = null
  private media: MediaQuery | undefined = undefined
  private readonly onMediaChange = (event: { matches: boolean }): void => {
    this.setSystemDark(event.matches)
  }

  constructor(private readonly host: ThemeHost = defaultHost()) {
    makeObservable<this, 'systemDark' | 'setSystemDark' | 'load'>(this, {
      preference: observable,
      systemDark: observable,
      resolved: computed,
      setPreference: actionBound,
      bindUser: action,
      setSystemDark: action,
      load: action,
    })
  }

  /** The arm in force: the preference, or the OS setting while `auto` (light until connected). */
  get resolved(): ResolvedTheme {
    if (this.preference !== 'auto') return this.preference
    return this.systemDark ? 'dark' : 'light'
  }

  /** Re-reads the persisted choice for the bound avatar and paints it on `<html>`. Idempotent. */
  apply(): void {
    this.load()
    this.paint()
  }

  /** Persists for the bound avatar (and the device, so the logged-out chrome keeps the last choice). */
  setPreference(preference: ThemePreference): void {
    this.preference = preference
    this.write(preference)
    this.paint()
  }

  /** Follows the signed-in avatar: its own persisted choice, else the device's, else `auto`. */
  bindUser(sub: string | null): void {
    this.sub = sub
    this.apply()
  }

  /** Starts following the OS setting (for `auto`) and paints. Safe to call twice. */
  connect(): void {
    if (!this.media) {
      const media = this.host.matchMedia?.(DARK_QUERY)
      if (media) {
        this.media = media
        this.setSystemDark(media.matches)
        media.addEventListener('change', this.onMediaChange)
      }
    }
    this.apply()
  }

  disconnect(): void {
    this.media?.removeEventListener('change', this.onMediaChange)
    this.media = undefined
  }

  private setSystemDark(matches: boolean): void {
    this.systemDark = matches
  }

  private load(): void {
    this.preference = this.read()
  }

  private read(): ThemePreference {
    const storage = this.host.localStorage
    if (!storage) return 'auto'
    try {
      const own = storage.getItem(themeStorageKey(this.sub))
      if (isPreference(own)) return own
      const device = this.sub ? storage.getItem(THEME_STORAGE_KEY) : null
      return isPreference(device) ? device : 'auto'
    } catch {
      // a storage that throws (a sandboxed frame, a full quota) costs the persistence, not the theme
      return 'auto'
    }
  }

  private write(preference: ThemePreference): void {
    const storage = this.host.localStorage
    if (!storage) return
    try {
      storage.setItem(themeStorageKey(this.sub), preference)
      if (this.sub) storage.setItem(THEME_STORAGE_KEY, preference)
    } catch {
      // see read()
    }
  }

  private paint(): void {
    const root = this.host.document?.documentElement
    if (!root) return
    if (this.preference === 'auto') delete root.dataset.theme
    else root.dataset.theme = this.preference
  }
}
