import { createActor } from 'xstate'
import { expect, test } from 'vitest'
import type { Alert } from '../lib/types'
import { appShellMachine } from './appShellMachine'

function alert(id: string, read: boolean): Alert {
  return {
    id,
    type: 'sale',
    message: `fixture ${id}`,
    memeId: null,
    read,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

test('MARK_READ marks only named ids and leaves the other alerts as the same objects', () => {
  const actor = createActor(appShellMachine)
  actor.start()
  const named = alert('a', false)
  const other = alert('b', false)
  const already = alert('c', true)

  actor.send({ type: 'LOGGED_IN' })
  actor.send({ type: 'SET_ALERTS', alerts: [named, other, already] })
  actor.send({ type: 'MARK_READ', ids: ['a'] })

  const snapshot = actor.getSnapshot()
  const marked = snapshot.context.alerts.find((item) => item.id === 'a')
  expect(snapshot.value).toBe('loggedIn')
  expect(marked?.read).toBe(true)
  expect(snapshot.context.alerts.find((item) => item.id === 'b')).toBe(other)
  expect(other.read).toBe(false)
  expect(snapshot.context.alerts.find((item) => item.id === 'c')).toBe(already)
  expect(already.read).toBe(true)
  expect(snapshot.context.wasUnread).toEqual(['a'])
  actor.stop()
})
