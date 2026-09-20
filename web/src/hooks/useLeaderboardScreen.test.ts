import { createActor } from 'xstate'
import { describe, expect, it } from 'vitest'
import { leaderboardCopy as copy } from '../copy/leaderboard'
import type { LeaderRow } from '../lib/types'
import { LEADERBOARD_PAGE_SIZE, leaderboardMachine } from '../stores/leaderboardMachine'
import { buildLeaderboardRowModel, pinYouRow } from './useLeaderboardScreen'

describe('leaderboard row model', () => {
  it('supplies a profile link and nullable avatar source before rendering', () => {
    const row = buildLeaderboardRowModel(
      {
        sub: 'top-brain',
        name: 'Top Brain',
        picture: '/top-brain.png',
        braincells: 42,
        collectionSize: 4,
        portfolioValue: 500,
      },
      3,
    )
    const noAvatar = buildLeaderboardRowModel(
      {
        ...row,
        picture: null,
        braincells: 42,
        collectionSize: 4,
        portfolioValue: 500,
      },
      0,
    )

    expect(row).toMatchObject({
      rankNumeral: '4',
      medal: null,
      profileLinkProps: { to: '/u/top-brain' },
      avatarSrc: '/top-brain.png',
    })
    expect(noAvatar.avatarSrc).toBeNull()
    expect(noAvatar.medal).toBe('gold')
  })

  /**
   * The podium's three tiles draw one glyph, so the metal is the only thing that says which place
   * each is — and the model has to name it. It said `'medal'` for all three once, which pushed the
   * choice into the screen as a comparison against the rank *string* and let a surface token
   * (`text-warning`, a chip fill) stand in for bronze without anything noticing.
   */
  it('hands the top three their own metal, in rank order, and nobody else one', () => {
    const leader = {
      sub: 'user-any',
      name: 'any',
      picture: null,
      braincells: 1,
      collectionSize: 1,
      portfolioValue: 1,
    }
    const metals = [0, 1, 2, 3, 4].map((index) => buildLeaderboardRowModel(leader, index).medal)

    expect(metals).toEqual(['gold', 'silver', 'bronze', null, null])
  })

  it('names the whole row once so the emoji columns can stay decorative', () => {
    const row = buildLeaderboardRowModel(
      {
        sub: 'user-pal',
        name: 'pal',
        picture: null,
        braincells: 1240,
        collectionSize: 8,
        portfolioValue: 90,
      },
      0,
    )

    expect(row).toMatchObject({
      linkLabel: copy.row.label(1, 'pal', 1240),
      collectionLabel: copy.row.collection(8),
      portfolioLabel: copy.row.portfolio(90),
      braincellsLabel: copy.row.braincells(1240),
      isMe: false,
    })
  })

  it('marks the signed-in player and leads their row label with "You"', () => {
    const leader = {
      sub: 'user-lou',
      name: 'lou',
      picture: null,
      braincells: 1,
      collectionSize: 3,
      portfolioValue: 40,
    }

    expect(buildLeaderboardRowModel(leader, 1, 'user-lou')).toMatchObject({
      isMe: true,
      linkLabel: copy.row.youLabel(copy.row.label(2, 'lou', 1)),
    })
    expect(buildLeaderboardRowModel(leader, 1, 'user-pal').isMe).toBe(false)
  })
})

const stub = (sub: string): LeaderRow => ({
  sub,
  name: sub,
  picture: null,
  braincells: 1,
  collectionSize: 1,
  portfolioValue: 1,
})

function rankedWithMeAt(meIndex: number, count: number) {
  return Array.from({ length: count }, (_, index) =>
    buildLeaderboardRowModel(stub(index === meIndex ? 'me' : `u${index}`), index, 'me'),
  )
}

describe('pinYouRow', () => {
  it('does not pin when isMe is already inside the visible window', () => {
    const ranked = rankedWithMeAt(1, 3)

    expect(pinYouRow(ranked, LEADERBOARD_PAGE_SIZE)).toBeNull()
    expect(pinYouRow(ranked, 2)).toBeNull()
  })

  it('pins isMe past the window with the unsliced rank numeral', () => {
    const ranked = rankedWithMeAt(9, 10)
    const you = pinYouRow(ranked, LEADERBOARD_PAGE_SIZE)

    expect(you).toMatchObject({ isMe: true, sub: 'me', rankNumeral: '10' })
  })

  it('clears the pin once the window grows past isMe', () => {
    const ranked = rankedWithMeAt(9, 10)

    expect(pinYouRow(ranked, LEADERBOARD_PAGE_SIZE)).not.toBeNull()
    expect(pinYouRow(ranked, LEADERBOARD_PAGE_SIZE * 2)).toBeNull()
  })
})

describe('leaderboardMachine wrapper', () => {
  it('SHOW_MORE grows visibleLimit 8 → 16', () => {
    const actor = createActor(leaderboardMachine).start()

    expect(LEADERBOARD_PAGE_SIZE).toBe(8)
    expect(actor.getSnapshot().context.visibleLimit).toBe(8)
    actor.send({ type: 'SHOW_MORE' })
    expect(actor.getSnapshot().context.visibleLimit).toBe(16)
    actor.stop()
  })

  it('FAIL then RETRY resets visibleLimit to 8', () => {
    const actor = createActor(leaderboardMachine).start()

    actor.send({ type: 'SHOW_MORE' })
    actor.send({ type: 'FAIL', err: 'offline' })
    expect(actor.getSnapshot().value).toBe('error')
    actor.send({ type: 'RETRY' })

    const snap = actor.getSnapshot()
    expect(snap.value).toBe('loading')
    expect(snap.context.err).toBeNull()
    expect(snap.context.visibleLimit).toBe(LEADERBOARD_PAGE_SIZE)
    actor.stop()
  })
})
