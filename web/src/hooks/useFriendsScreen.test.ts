import { describe, expect, it } from 'vitest'
import { buildFriendLinkModel } from './useFriendsScreen'

describe('friend row model', () => {
  it('keeps nullable avatar data out of screen markup while preserving its current display semantics', () => {
    const withAvatar = buildFriendLinkModel({ sub: 'pal', name: 'Pal', picture: '/pal.png' })
    const withoutAvatar = buildFriendLinkModel({ sub: 'no-picture', name: 'no picture', picture: null })

    expect(withAvatar.profileLinkProps).toEqual({ to: '/u/pal' })
    expect(withAvatar.onlineLinkProps).toEqual({ to: '/u/pal', title: 'Pal' })
    expect(withAvatar.avatarSrc).toBe('/pal.png')
    expect(withoutAvatar.avatarSrc).toBeNull()
  })
})
