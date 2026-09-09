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
