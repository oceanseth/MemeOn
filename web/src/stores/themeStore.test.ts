import { autorun, configure } from 'mobx'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, ThemeStore, themeStorageKey, type ThemeHost } from './themeStore'

type Listener = (event: { matches: boolean }) => void

/** A `window` stand-in: a Map for storage, a dataset object for `<html>`, one media query. */
function fakeHost(initial: Record<string, string> = {}, systemDark = false) {
  const items = new Map(Object.entries(initial))
  const listeners = new Set<Listener>()
  const dataset: Record<string, string | undefined> = {}
  const media = {
    matches: systemDark,
    addEventListener: vi.fn((_type: 'change', listener: Listener) => { listeners.add(listener) }),
    removeEventListener: vi.fn((_type: 'change', listener: Listener) => { listeners.delete(listener) }),
  }
  const host: ThemeHost = {
    document: { documentElement: { dataset } },
    localStorage: {
      getItem: vi.fn((key: string) => items.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { items.set(key, value) }),
    },
    matchMedia: vi.fn(() => media),
  }
  const flip = (matches: boolean) => {
    media.matches = matches
    for (const listener of listeners) listener({ matches })
  }
  return { host, items, dataset, media, listeners, flip }
}

afterEach(() => {
  configure({ enforceActions: 'observed' })
  vi.restoreAllMocks()
})

describe('themeStorageKey', () => {
  it('is the device key when logged out and a per-avatar key when signed in', () => {
    expect(themeStorageKey(null)).toBe(THEME_STORAGE_KEY)
    expect(themeStorageKey('user-lou')).toBe(`${THEME_STORAGE_KEY}:user-lou`)
  })
})

describe('ThemeStore', () => {
  it('constructs inert: no storage read, no media query, nothing on <html>', () => {
    const { host, dataset, media } = fakeHost({ [THEME_STORAGE_KEY]: 'dark' }, true)
    const theme = new ThemeStore(host)
    expect(host.localStorage!.getItem).not.toHaveBeenCalled()
    expect(host.matchMedia).not.toHaveBeenCalled()
    expect(media.addEventListener).not.toHaveBeenCalled()
    expect(dataset).toEqual({})
    expect(theme.preference).toBe('auto')
    expect(theme.resolved).toBe('light')
  })

  it('apply() reads the device key and paints it, and removes the attribute for auto', () => {
    const { host, dataset, items } = fakeHost({ [THEME_STORAGE_KEY]: 'dark' })
    const theme = new ThemeStore(host)
    theme.apply()
    expect(theme.preference).toBe('dark')
    expect(theme.resolved).toBe('dark')
    expect(dataset.theme).toBe('dark')
    expect(host.matchMedia).not.toHaveBeenCalled()

    items.set(THEME_STORAGE_KEY, 'auto')
    theme.apply()
    expect(theme.preference).toBe('auto')
    expect('theme' in dataset).toBe(false)
  })

  it('treats anything but the three preferences in storage as auto', () => {
    const { host, dataset } = fakeHost({ [THEME_STORAGE_KEY]: 'blue' })
    const theme = new ThemeStore(host)
    theme.apply()
    expect(theme.preference).toBe('auto')
    expect('theme' in dataset).toBe(false)
  })

  it('connect() follows the OS while auto, and disconnect() stops listening', () => {
    const { host, dataset, media, flip } = fakeHost({}, true)
    const theme = new ThemeStore(host)
    theme.connect()
    expect(host.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    expect(theme.preference).toBe('auto')
    expect(theme.resolved).toBe('dark')
    expect('theme' in dataset).toBe(false)

    flip(false)
    expect(theme.resolved).toBe('light')
    flip(true)
    expect(theme.resolved).toBe('dark')

    theme.connect()
    expect(host.matchMedia).toHaveBeenCalledTimes(1)
    expect(media.addEventListener).toHaveBeenCalledTimes(1)

    theme.disconnect()
    expect(media.removeEventListener).toHaveBeenCalledTimes(1)
    flip(false)
    expect(theme.resolved).toBe('dark')
  })

  it('an explicit preference wins over the OS and pins <html>', () => {
    const { host, dataset, flip } = fakeHost({}, true)
    const theme = new ThemeStore(host)
    theme.connect()
    theme.setPreference('light')
    expect(theme.resolved).toBe('light')
    expect(dataset.theme).toBe('light')
    flip(false)
    flip(true)
    expect(theme.resolved).toBe('light')
    theme.setPreference('auto')
    expect(theme.resolved).toBe('dark')
    expect('theme' in dataset).toBe(false)
  })

  it('setPreference() persists to the device key while logged out', () => {
    const { host, items } = fakeHost()
    const theme = new ThemeStore(host)
    theme.setPreference('dark')
    expect(items.get(THEME_STORAGE_KEY)).toBe('dark')
    expect([...items.keys()]).toEqual([THEME_STORAGE_KEY])
  })

  it('setPreference() persists per avatar and to the device key while signed in', () => {
    const { host, items, dataset } = fakeHost()
    const theme = new ThemeStore(host)
    theme.bindUser('user-lou')
    theme.setPreference('light')
    expect(items.get(themeStorageKey('user-lou'))).toBe('light')
    expect(items.get(THEME_STORAGE_KEY)).toBe('light')
    expect(dataset.theme).toBe('light')
  })

  it('bindUser() re-reads the avatar key, falling back to the device key', () => {
    const { host, dataset } = fakeHost({
      [THEME_STORAGE_KEY]: 'dark',
      [themeStorageKey('user-pal')]: 'light',
    })
    const theme = new ThemeStore(host)
    theme.apply()
    expect(dataset.theme).toBe('dark')
    theme.bindUser('user-pal')
    expect(theme.preference).toBe('light')
    expect(dataset.theme).toBe('light')
    theme.bindUser('user-new')
    expect(theme.preference).toBe('dark')
    expect(dataset.theme).toBe('dark')
    theme.bindUser(null)
    expect(theme.preference).toBe('dark')
  })

  it('an avatar with its own choice is not overwritten by the device key', () => {
    const { host, items } = fakeHost({ [themeStorageKey('user-pal')]: 'light' })
    const theme = new ThemeStore(host)
    theme.bindUser('user-pal')
    expect(theme.preference).toBe('light')
    theme.setPreference('dark')
    theme.bindUser(null)
    expect(theme.preference).toBe('dark')
    theme.bindUser('user-pal')
    expect(theme.preference).toBe('dark')
    expect(items.get(themeStorageKey('user-pal'))).toBe('dark')
  })

  it('is observable: preference and resolved change inside actions', () => {
    const warning = vi.spyOn(console, 'warn')
    configure({ enforceActions: 'always' })
    const { host, flip } = fakeHost()
    const theme = new ThemeStore(host)
    const seen: string[] = []
    const stop = autorun(() => { seen.push(`${theme.preference}/${theme.resolved}`) })
    try {
      theme.connect()
      flip(true)
      theme.setPreference('light')
      theme.bindUser('user-lou')
      theme.setPreference('auto')
      expect(seen).toEqual(['auto/light', 'auto/dark', 'light/light', 'auto/dark'])
      expect(warning).not.toHaveBeenCalled()
    } finally {
      stop()
      theme.disconnect()
    }
  })

  it('does nothing without a host (node), and still tracks the preference', () => {
    const theme = new ThemeStore({})
    theme.connect()
    theme.apply()
    theme.bindUser('user-lou')
    theme.setPreference('dark')
    expect(theme.preference).toBe('dark')
    expect(theme.resolved).toBe('dark')
    theme.disconnect()
  })

  it('survives a storage that throws', () => {
    const host: ThemeHost = {
      localStorage: {
        getItem: () => { throw new Error('SecurityError') },
        setItem: () => { throw new Error('QuotaExceededError') },
      },
    }
    const theme = new ThemeStore(host)
    theme.apply()
    expect(theme.preference).toBe('auto')
    theme.setPreference('light')
    expect(theme.preference).toBe('light')
  })
})
