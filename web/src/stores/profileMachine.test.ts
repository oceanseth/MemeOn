import { createActor } from 'xstate'
import { expect, it } from 'vitest'
import { profileMachine, type ProfileData } from './profileMachine'

const data: ProfileData = {
  profile: { sub: 'pal', name: 'Pal', picture: null, followers: 1, collectionSize: 0, portfolioValue: 0 },
  followingByMe: false, friendStatus: null, created: [], binder: [],
}

const idle = { busy: false, actionErr: null }

it('owns initial tab, load results, and tab changes across relationship reloads', () => {
  const actor = createActor(profileMachine, { input: { initialTab: 'binder' } }).start()
  expect(actor.getSnapshot().matches('loading')).toBe(true)
  expect(actor.getSnapshot().context.tab).toBe('binder')
  actor.send({ type: 'DONE', data })
  actor.send({ type: 'SET_TAB', tab: 'created' })
  const updated = { ...data, followingByMe: true, friendStatus: 'accepted' as const }
  actor.send({ type: 'DONE', data: updated })
  expect(actor.getSnapshot().matches('ready')).toBe(true)
  expect(actor.getSnapshot().context).toEqual({ data: updated, tab: 'created', err: null, errKind: null, ...idle })
  actor.stop()
})

it('separates a dead link from a transport failure and clears it once a retry lands', () => {
  const actor = createActor(profileMachine, { input: {} }).start()
  actor.send({ type: 'FAIL', err: 'not found', kind: 'notfound' })
  expect(actor.getSnapshot().matches('error')).toBe(true)
  expect(actor.getSnapshot().context.errKind).toBe('notfound')
  actor.send({ type: 'FAIL', err: 'offline', kind: 'transport' })
  expect(actor.getSnapshot().context.errKind).toBe('transport')
  // Retry that succeeds leaves no stale error behind.
  actor.send({ type: 'DONE', data })
  expect(actor.getSnapshot().context).toEqual({ data, tab: 'created', err: null, errKind: null, ...idle })
  actor.stop()
})

it('keeps the loaded profile on screen while a relationship action runs, fails, or settles', () => {
  const actor = createActor(profileMachine, { input: {} }).start()
  actor.send({ type: 'DONE', data })
  actor.send({ type: 'BEGIN_ACTION' })
  expect(actor.getSnapshot().context.busy).toBe(true)
  actor.send({ type: 'FAIL_ACTION', err: "Couldn't update — try again." })
  expect(actor.getSnapshot().matches('ready')).toBe(true)
  expect(actor.getSnapshot().context.busy).toBe(false)
  expect(actor.getSnapshot().context.actionErr).toBe("Couldn't update — try again.")
  actor.send({ type: 'BEGIN_ACTION' })
  expect(actor.getSnapshot().context.actionErr).toBeNull()
  actor.send({ type: 'SET_FOLLOWING', following: true })
  actor.send({ type: 'SETTLE_ACTION' })
  expect(actor.getSnapshot().context.data?.followingByMe).toBe(true)
  expect(actor.getSnapshot().context.busy).toBe(false)
  actor.stop()
})
