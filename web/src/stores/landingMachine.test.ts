import { createActor } from 'xstate'
import { expect, test, vi } from 'vitest'
import { landingMachine } from './landingMachine'

function startLanding(startLogin: () => void = () => {}) {
  const actor = createActor(landingMachine.provide({ actions: { startLogin } }))
  actor.start()
  return actor
}

test('login failure stays visible until retry', () => {
  const actor = startLanding()
  actor.send({ type: 'LOGIN' })
  expect(actor.getSnapshot().context.busy).toBe(true)

  actor.send({ type: 'FAIL', err: 'Masky is unavailable' })
  expect(actor.getSnapshot().value).toBe('loginError')
  expect(actor.getSnapshot().context).toEqual({
    busy: false,
    err: 'Masky is unavailable',
  })
  actor.stop()
})

test('retry clears the prior error and rejects duplicate active login', () => {
  const startLogin = vi.fn()
  const actor = startLanding(startLogin)

  actor.send({ type: 'LOGIN' })
  actor.send({ type: 'LOGIN' })
  expect(startLogin).toHaveBeenCalledTimes(1)
  actor.send({ type: 'FAIL', err: 'Try again' })
  expect(actor.getSnapshot().can({ type: 'LOGIN' })).toBe(true)

  actor.send({ type: 'LOGIN' })
  actor.send({ type: 'LOGIN' })
  expect(actor.getSnapshot().context.busy).toBe(true)
  expect(actor.getSnapshot().context.err).toBeNull()
  expect(actor.getSnapshot().can({ type: 'LOGIN' })).toBe(false)
  expect(startLogin).toHaveBeenCalledTimes(2)
  actor.stop()
})
