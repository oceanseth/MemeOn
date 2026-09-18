import { createActor } from 'xstate'
import { expect, it } from 'vitest'
import { friendsMachine } from './friendsMachine'

it('keeps a pending gift request busy while its dialog closes and reopens', () => {
  const actor = createActor(friendsMachine).start()
  const recipient = { sub: 'pal', name: 'Pal' }

  actor.send({ type: 'OPEN_GIFT', recipient })
  actor.send({ type: 'SET_GIFT_BUSY', busy: true })
  actor.send({ type: 'CLOSE_GIFT' })
  actor.send({ type: 'OPEN_GIFT', recipient })

  expect(actor.getSnapshot().context.giftBusy).toBe(true)

  actor.send({ type: 'SET_GIFT_BUSY', busy: false })
  expect(actor.getSnapshot().context.giftBusy).toBe(false)
})

it('keeps mutation failures, in-flight rows and pending removals out of the load error phase', () => {
  const actor = createActor(friendsMachine).start()

  actor.send({ type: 'SET_PENDING', sub: 'pal' })
  actor.send({ type: 'SET_ACTION_ERR', err: "Couldn't remove that friend. Try again." })
  actor.send({ type: 'ASK_REMOVE', removal: { sub: 'pal', name: 'Pal', kind: 'remove' } })

  expect(actor.getSnapshot().value).toBe('loading')
  expect(actor.getSnapshot().context.err).toBeNull()
  expect(actor.getSnapshot().context.pendingSub).toBe('pal')
  expect(actor.getSnapshot().context.pendingRemoval).toEqual({ sub: 'pal', name: 'Pal', kind: 'remove' })

  actor.send({ type: 'CLOSE_REMOVE' })
  actor.send({ type: 'SET_PENDING', sub: null })
  expect(actor.getSnapshot().context.pendingRemoval).toBeNull()
  expect(actor.getSnapshot().context.actionErr).toBe("Couldn't remove that friend. Try again.")
})

it('reaches the error phase when a load actually fails, instead of reporting an empty circle', () => {
  const actor = createActor(friendsMachine).start()

  actor.send({ type: 'FAIL', err: 'Check your connection and try again.' })

  expect(actor.getSnapshot().value).toBe('error')
  expect(actor.getSnapshot().context.err).toBe('Check your connection and try again.')
})

it('holds raw share text while typing and drops it when the pick changes', () => {
  const actor = createActor(friendsMachine).start()

  actor.send({ type: 'SET_GIFT_SHARES_INPUT', value: '' })
  expect(actor.getSnapshot().context.giftSharesInput).toBe('')

  actor.send({ type: 'OPEN_GIFT', recipient: { sub: 'pal', name: 'Pal' } })
  expect(actor.getSnapshot().context.giftSharesInput).toBeNull()
})
