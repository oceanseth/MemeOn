import { createActor } from 'xstate'
import { expect, test, vi } from 'vitest'
import { landingMachine } from './landingMachine'

function startLanding(startLogin: () => void = () => {}) {
  const actor = createActor(landingMachine.provide({ actions: { startLogin } }))
  actor.start()
  return actor
}

test('login failure is retained when authentication settles before frames', () => {
  const actor = startLanding()

  actor.send({ type: 'LOGIN' })
  expect(actor.getSnapshot().context.busy).toBe(true)

  actor.send({ type: 'FAIL', err: 'Masky is unavailable' })
  actor.send({ type: 'SET_FRAMES', frames: { gold: '/gold.png' } })

  expect(actor.getSnapshot().context).toEqual({
    frames: { gold: '/gold.png' },
    fallbackFrames: [],
    brokenFrames: [],
    busy: false,
    err: 'Masky is unavailable',
  })
  actor.stop()
})

test('login failure is visible when frames settle before authentication', () => {
  const actor = startLanding()

  actor.send({ type: 'LOGIN' })
  actor.send({ type: 'SET_FRAMES', frames: { paper: '/paper.png' } })
  actor.send({ type: 'FAIL', err: 'Masky is unavailable' })

  expect(actor.getSnapshot().context).toEqual({
    frames: { paper: '/paper.png' },
    fallbackFrames: [],
    brokenFrames: [],
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

test('an empty frame result does not block login', () => {
  const actor = startLanding()

  actor.send({ type: 'SET_FRAMES', frames: {} })
  actor.send({ type: 'LOGIN' })

  expect(actor.getSnapshot().context.busy).toBe(true)
  expect(actor.getSnapshot().context.err).toBeNull()
  actor.stop()
})

test('a frame that cannot load is recorded once, never twice, and never hidden by hand', () => {
  const actor = startLanding()

  actor.send({ type: 'SET_FRAMES', frames: { paper: '/paper.png' } })
  actor.send({ type: 'FRAME_FALLBACK', key: 'paper' })
  actor.send({ type: 'FRAME_FALLBACK', key: 'paper' })
  expect(actor.getSnapshot().context.fallbackFrames).toEqual(['paper'])
  expect(actor.getSnapshot().context.brokenFrames).toEqual([])

  actor.send({ type: 'FRAME_FAILED', key: 'paper' })
  actor.send({ type: 'FRAME_FAILED', key: 'gold' })
  expect(actor.getSnapshot().context.brokenFrames).toEqual(['paper', 'gold'])
  actor.stop()
})

test('a fresh frame payload retries every tier', () => {
  const actor = startLanding()

  actor.send({ type: 'FRAME_FALLBACK', key: 'gold' })
  actor.send({ type: 'SET_FRAMES', frames: { gold: '/gold.png' } })
  actor.send({ type: 'FRAME_FAILED', key: 'gold' })
  actor.send({ type: 'SET_FRAMES', frames: { gold: '/gold-v2.png' } })

  expect(actor.getSnapshot().context.fallbackFrames).toEqual([])
  expect(actor.getSnapshot().context.brokenFrames).toEqual([])
  expect(actor.getSnapshot().context.frames).toEqual({ gold: '/gold-v2.png' })
  actor.stop()
})
