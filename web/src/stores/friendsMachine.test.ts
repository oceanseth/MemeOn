import { createActor } from 'xstate'
import { expect, it } from 'vitest'
import { friendsCopy } from '../copy/friends'
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

it('keeps a search failure off the load error phase and does not empty hits', () => {
  const actor = createActor(friendsMachine).start()
  const hit = { sub: 'pal', name: 'Pal', picture: null }

  actor.send({ type: 'SET_HITS', hits: [hit] })
  actor.send({ type: 'SET_SEARCH_ERR', err: friendsCopy.search.failed })

  expect(actor.getSnapshot().value).toBe('loading')
  expect(actor.getSnapshot().context.err).toBeNull()
  expect(actor.getSnapshot().context.actionErr).toBeNull()
  expect(actor.getSnapshot().context.hits).toEqual([hit])
  expect(actor.getSnapshot().context.searchErr).toBe(friendsCopy.search.failed)

  actor.send({ type: 'SET_HITS', hits: [] })
  expect(actor.getSnapshot().context.searchErr).toBeNull()
  expect(actor.getSnapshot().value).toBe('loading')
})

it('reaches the error phase when a load actually fails, instead of reporting an empty circle', () => {
  const actor = createActor(friendsMachine).start()

  actor.send({ type: 'FAIL', err: 'Check your connection and try again.' })

  expect(actor.getSnapshot().value).toBe('error')
  expect(actor.getSnapshot().context.err).toBe('Check your connection and try again.')
})

it('keeps copyFailed across a copied:false timer unless failed:true', () => {
  const actor = createActor(friendsMachine).start()
  actor.send({ type: 'SET_COPIED', copied: false, failed: true })
  expect(actor.getSnapshot().context).toMatchObject({ copied: false, copyFailed: true })

  actor.send({ type: 'SET_COPIED', copied: false })
  expect(actor.getSnapshot().context.copyFailed).toBe(true)

  actor.send({ type: 'SET_COPIED', copied: true })
  expect(actor.getSnapshot().context).toMatchObject({ copied: true, copyFailed: false })

  actor.send({ type: 'SET_COPIED', copied: false })
  expect(actor.getSnapshot().context).toMatchObject({ copied: false, copyFailed: false })
})

it('holds raw share text while typing and drops it when the pick changes', () => {
  const actor = createActor(friendsMachine).start()

  actor.send({ type: 'SET_GIFT_SHARES_INPUT', value: '' })
  expect(actor.getSnapshot().context.giftSharesInput).toBe('')

  actor.send({ type: 'OPEN_GIFT', recipient: { sub: 'pal', name: 'Pal' } })
  expect(actor.getSnapshot().context.giftSharesInput).toBeNull()
})
