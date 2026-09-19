import { createActor } from 'xstate'
import { expect, it } from 'vitest'
import { BINDER_PAGE_SIZE, binderMachine } from './binderMachine'

function start() {
  return createActor(binderMachine).start()
}

it('SHOW_MORE adds a page of 12 without changing phase', () => {
  expect(BINDER_PAGE_SIZE).toBe(12)
  const actor = start()
  expect(actor.getSnapshot().value).toBe('loading')
  expect(actor.getSnapshot().context.visibleLimit).toBe(BINDER_PAGE_SIZE)

  actor.send({ type: 'SHOW_MORE' })

  expect(actor.getSnapshot().value).toBe('loading')
  expect(actor.getSnapshot().context.visibleLimit).toBe(BINDER_PAGE_SIZE + 12)
  actor.stop()
})

it('SET_SHOW_PRIVATE and SET_SORT reset visibleLimit to 12', () => {
  const actor = start()
  actor.send({ type: 'SHOW_MORE' })
  actor.send({ type: 'SET_SHOW_PRIVATE', showPrivate: true })
  expect(actor.getSnapshot().context.showPrivate).toBe(true)
  expect(actor.getSnapshot().context.visibleLimit).toBe(BINDER_PAGE_SIZE)

  actor.send({ type: 'SHOW_MORE' })
  actor.send({ type: 'SET_SORT', sortKey: 'value', sortDir: 'asc' })
  expect(actor.getSnapshot().context.sortKey).toBe('value')
  expect(actor.getSnapshot().context.sortDir).toBe('asc')
  expect(actor.getSnapshot().context.visibleLimit).toBe(BINDER_PAGE_SIZE)
  actor.stop()
})

it('RETRY after SHOW_MORE then FAIL goes to loading, clears err, and leaves visibleLimit', () => {
  const actor = start()
  actor.send({ type: 'SHOW_MORE' })
  actor.send({ type: 'FAIL', err: 'offline' })
  expect(actor.getSnapshot().value).toBe('error')
  expect(actor.getSnapshot().context.err).toBe('offline')
  expect(actor.getSnapshot().context.visibleLimit).toBe(BINDER_PAGE_SIZE * 2)

  actor.send({ type: 'RETRY' })

  const snap = actor.getSnapshot()
  expect(snap.value).toBe('loading')
  expect(snap.context.err).toBeNull()
  expect(snap.context.visibleLimit).toBe(BINDER_PAGE_SIZE * 2)
  expect(snap.context.showPrivate).toBe(false)
  expect(snap.context.sortKey).toBe('new')
  actor.stop()
})
