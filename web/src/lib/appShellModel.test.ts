import { describe, expect, it } from 'vitest'
import { appShellCopy } from '../copy/appShell'
import { buildAppShellChrome, routeFamily } from './appShellModel'

describe('routeFamily', () => {
  it('maps chrome routes, including /m/ also matching /marketplace/…', () => {
    expect(routeFamily('/marketplace', null)).toBe('marketplace')
    // /m/… is a meme URL; it currently shares the marketplace family. Do not split it.
    expect(routeFamily('/m/meme-paper', null)).toBe('marketplace')
    expect(routeFamily('/meme/meme-paper', null)).toBe('marketplace')
    expect(routeFamily('/marketplace/extra', null)).toBe(null)
    expect(routeFamily('/binder', 'user-lou')).toBe('binder')
    expect(routeFamily('/binder/user-lou', 'user-lou')).toBe('binder')
    expect(routeFamily('/binder/other', 'user-lou')).toBe(null)
    expect(routeFamily('/binder/user-lou', null)).toBe(null)
    expect(routeFamily('/binder/new', 'user-lou')).toBe('mint')
    expect(routeFamily('/friends', null)).toBe('friends')
    expect(routeFamily('/trade', null)).toBe('trade')
    expect(routeFamily('/leaderboard', null)).toBe('leaderboard')
    expect(routeFamily('/settings', null)).toBe('settings')
    expect(routeFamily('/settings/theme', null)).toBe('settings')
    expect(routeFamily('/developers', null)).toBe('developers')
    expect(routeFamily('/discord', null)).toBe('discord')
    expect(routeFamily('/discord/link', null)).toBe('discord')
    expect(routeFamily('/', null)).toBe(null)
    expect(routeFamily('/u/user-lou', 'user-lou')).toBe(null)
    expect(routeFamily('/auth/callback', null)).toBe(null)
  })

  it('builds skip/footer/brand chrome from copy', () => {
    expect(buildAppShellChrome()).toEqual({
      skip: appShellCopy.skip,
      brand: appShellCopy.brand,
      navAria: appShellCopy.navAria,
      footerAria: appShellCopy.footerAria,
      footer: appShellCopy.footer,
    })
  })
})
