import { describe, expect, it } from 'vitest'
import { leaderboardCopy as copy } from '../copy/leaderboard'
import { buildLeaderboardRowModel } from './useLeaderboardScreen'

describe('leaderboard row model', () => {
  it('supplies a profile link and nullable avatar source before rendering', () => {
    const row = buildLeaderboardRowModel({
      sub: 'top-brain', name: 'Top Brain', picture: '/top-brain.png', braincells: 42,
      collectionSize: 4, portfolioValue: 500,
    }, 3)
    const noAvatar = buildLeaderboardRowModel({ ...row, picture: null, braincells: 42, collectionSize: 4, portfolioValue: 500 }, 0)

    expect(row).toMatchObject({ rankNumeral: '4', medalLabel: '', profileLinkProps: { to: '/u/top-brain' }, avatarSrc: '/top-brain.png' })
    expect(noAvatar.avatarSrc).toBeNull()
    expect(noAvatar.medalLabel).toBe(copy.row.medals[0])
  })

  it('names the whole row once so the emoji columns can stay decorative', () => {
    const row = buildLeaderboardRowModel({
      sub: 'user-pal', name: 'pal', picture: null, braincells: 1240, collectionSize: 8, portfolioValue: 90,
    }, 0)

    expect(row).toMatchObject({
      linkLabel: copy.row.label(1, 'pal', 1240),
      collectionLabel: copy.row.collection(8),
      portfolioLabel: copy.row.portfolio(90),
      braincellsLabel: copy.row.braincells(1240),
      isMe: false,
    })
  })

  it('marks the signed-in player and leads their row label with "You"', () => {
    const leader = { sub: 'user-lou', name: 'lou', picture: null, braincells: 1, collectionSize: 3, portfolioValue: 40 }

    expect(buildLeaderboardRowModel(leader, 1, 'user-lou')).toMatchObject({
      isMe: true,
      linkLabel: copy.row.youLabel(copy.row.label(2, 'lou', 1)),
    })
    expect(buildLeaderboardRowModel(leader, 1, 'user-pal').isMe).toBe(false)
  })
})
