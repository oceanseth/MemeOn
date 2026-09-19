import { describe, expect, it } from 'vitest'
import { routeFamily } from './appShellModel'

describe('routeFamily', () => {
  it.each([
    ['/marketplace', 'lou', 'marketplace'],
    ['/m/abc', 'lou', 'marketplace'],
    ['/meme/abc', 'lou', 'marketplace'],
    ['/binder/new', 'lou', 'mint'],
    ['/binder', 'lou', 'binder'],
    ['/friends', 'lou', 'friends'],
    ['/trade', 'lou', 'trade'],
    ['/leaderboard', 'lou', 'leaderboard'],
    ['/settings', 'lou', 'settings'],
    ['/settings/x', 'lou', 'settings'],
    ['/developers', 'lou', 'developers'],
    ['/discord', 'lou', 'discord'],
    ['/discord/x', 'lou', 'discord'],
    ['/', 'lou', null],
    ['/nope', 'lou', null],
    ['/u/sub', 'lou', null],
  ] as const)('%s (sub %s) → %s', (pathname, sub, family) => {
    expect(routeFamily(pathname, sub)).toBe(family)
  })

  it('treats the encoded own-binder path as binder and a different sub as unknown', () => {
    const sub = 'mask/a + b'
    expect(routeFamily(`/binder/${encodeURIComponent(sub)}`, sub)).toBe('binder')
    expect(routeFamily('/binder/other', sub)).toBe(null)
    expect(routeFamily('/binder/other', 'lou')).toBe(null)
    expect(routeFamily(`/binder/${encodeURIComponent(sub)}`, 'lou')).toBe(null)
  })
})
