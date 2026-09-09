import { createActor } from 'xstate'
import { expect, it } from 'vitest'
import { profileMachine, type ProfileData } from './profileMachine'

const data: ProfileData = {
  profile: { sub: 'pal', name: 'Pal', picture: null, followers: 1, collectionSize: 0, portfolioValue: 0 },
  followingByMe: false, friendStatus: null, created: [], binder: [],
}

it('owns initial tab, load results, and tab changes across relationship reloads', () => {
  const actor = createActor(profileMachine, { input: { initialTab: 'binder' } }).start()
  expect(actor.getSnapshot().matches('loading')).toBe(true)
  expect(actor.getSnapshot().context.tab).toBe('binder')
  actor.send({ type: 'DONE', data })
  actor.send({ type: 'SET_TAB', tab: 'created' })
  const updated = { ...data, followingByMe: true, friendStatus: 'accepted' as const }
  actor.send({ type: 'DONE', data: updated })
  expect(actor.getSnapshot().matches('ready')).toBe(true)
  expect(actor.getSnapshot().context).toEqual({ data: updated, tab: 'created', err: null })
  actor.stop()
})

it('preserves existing load failure presentation and retained profile data', () => {
  const actor = createActor(profileMachine, { input: {} }).start()
  actor.send({ type: 'FAIL', err: 'profile not found' })
  expect(actor.getSnapshot().matches('error')).toBe(true)
  expect(actor.getSnapshot().context).toEqual({ data: null, tab: 'created', err: 'profile not found' })
  actor.send({ type: 'DONE', data })
  // The existing screen keeps its error notice even if a later reload supplies data.
  expect(actor.getSnapshot().context).toEqual({ data, tab: 'created', err: 'profile not found' })
  actor.stop()
})
