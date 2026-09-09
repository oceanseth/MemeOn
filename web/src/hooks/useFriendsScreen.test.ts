import { describe, expect, it } from 'vitest'
import { buildFriendLinkModel } from './useFriendsScreen'

describe('friend row model', () => {
  it('keeps nullable avatar data out of screen markup while preserving its current display semantics', () => {
    const withAvatar = buildFriendLinkModel({ sub: 'pal', name: 'Pal', picture: '/pal.png' })
    const withoutAvatar = buildFriendLinkModel({ sub: 'no-picture', name: 'no picture', picture: null })

    expect(withAvatar.profileLinkProps).toEqual({ to: '/u/pal' })
    expect(withAvatar.onlineLinkProps).toEqual({ to: '/u/pal', title: 'Pal' })
    expect(withAvatar.avatarImageProps).toMatchObject({ src: '/pal.png', alt: '', loading: 'lazy', referrerPolicy: 'no-referrer' })
    expect(withAvatar.onlineAvatarImageProps).toMatchObject({ src: '/pal.png', alt: 'Pal', loading: 'lazy', referrerPolicy: 'no-referrer' })
    expect(typeof withAvatar.avatarImageProps?.onError).toBe('function')
    expect(withoutAvatar.avatarImageProps).toBeNull()
    expect(withoutAvatar.onlineAvatarImageProps).toBeNull()
  })

  it('always supplies an avatar slot initial so no row collapses to bare text', () => {
    expect(buildFriendLinkModel({ sub: 'a', name: 'pal', picture: null }).avatarInitial).toBe('P')
    expect(buildFriendLinkModel({ sub: 'b', name: '  ', picture: null }).avatarInitial).toBe('?')
  })
})
