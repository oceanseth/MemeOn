import { describe, expect, it } from 'vitest'
import { buildLeaderboardRowModel } from './useLeaderboardScreen'

describe('leaderboard row model', () => {
  it('supplies a profile link and nullable avatar element props before rendering', () => {
    const row = buildLeaderboardRowModel({
      sub: 'top-brain', name: 'Top Brain', picture: '/top-brain.png', braincells: 42,
      collectionSize: 4, portfolioValue: 500,
    }, 3)
    const noAvatar = buildLeaderboardRowModel({ ...row, picture: null, braincells: 42, collectionSize: 4, portfolioValue: 500 }, 0)

    expect(row).toMatchObject({ rankLabel: '#4', profileLinkProps: { to: '/u/top-brain' }, avatarImageProps: { src: '/top-brain.png', alt: '' } })
    expect(noAvatar.avatarImageProps).toBeNull()
  })
})
