import { createActor } from 'xstate'
import { expect, it } from 'vitest'
import type { LeaderRow } from '../lib/types'
import { LEADERBOARD_PAGE_SIZE, leaderboardMachine } from './leaderboardMachine'

function leader(sub: string): LeaderRow {
  return { sub, name: sub, picture: null, braincells: 1, portfolioValue: 1, collectionSize: 1 }
}

function start() {
  return createActor(leaderboardMachine).start()
}

it('SHOW_MORE grows visibleLimit by LEADERBOARD_PAGE_SIZE without leaving ready', () => {
  expect(LEADERBOARD_PAGE_SIZE).toBe(8)
  const actor = start()
  actor.send({ type: 'DONE', leaders: [leader('a')] })
  expect(actor.getSnapshot().value).toBe('ready')
  expect(actor.getSnapshot().context.visibleLimit).toBe(LEADERBOARD_PAGE_SIZE)

  actor.send({ type: 'SHOW_MORE' })

  expect(actor.getSnapshot().value).toBe('ready')
  expect(actor.getSnapshot().context.visibleLimit).toBe(LEADERBOARD_PAGE_SIZE * 2)
  actor.stop()
})

it('RETRY after SHOW_MORE then FAIL goes to loading, clears err, and resets visibleLimit to 8', () => {
  const actor = start()
  actor.send({ type: 'DONE', leaders: [leader('a')] })
  actor.send({ type: 'SHOW_MORE' })
  actor.send({ type: 'FAIL', err: 'offline' })
  expect(actor.getSnapshot().value).toBe('error')
  expect(actor.getSnapshot().context.err).toBe('offline')
  expect(actor.getSnapshot().context.visibleLimit).toBe(LEADERBOARD_PAGE_SIZE * 2)

  actor.send({ type: 'RETRY' })

  const snap = actor.getSnapshot()
  expect(snap.value).toBe('loading')
  expect(snap.context.err).toBeNull()
  expect(snap.context.visibleLimit).toBe(LEADERBOARD_PAGE_SIZE)
  actor.stop()
})
