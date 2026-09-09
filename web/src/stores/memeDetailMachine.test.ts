import { createActor } from 'xstate'
import { describe, expect, it } from 'vitest'
import { tierFor } from '../../../shared/tiers'
import type { Meme, Position } from '../lib/types'
import { clampPrice, clampShares, memeDetailMachine } from './memeDetailMachine'

const meme: Meme = {
  id: 'meme-a',
  title: 'Meme A',
  description: null,
  mediaType: 'image',
  imageUrl: 'https://example.test/a.png',
  videoUrl: null,
  tags: [],
  creatorId: 'creator-a',
  creatorName: 'Creator A',
  ownerId: 'owner-a',
  ownerName: 'Owner A',
  reshares: 0,
  tierKey: 'paper',
  listing: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  tier: tierFor(0),
  value: 1,
}

const positions: Position[] = [{ memeId: meme.id, userId: 'owner-a', shares: 100 }]
const reloadedMeme = { ...meme, title: 'Reloaded meme' }
const reloadedPositions: Position[] = [{ memeId: meme.id, userId: 'holder-b', shares: 25 }]

function readyActor() {
  const actor = createActor(memeDetailMachine, { input: { id: meme.id } }).start()
  actor.send({ type: 'LOADED', meme, positions })
  return actor
}

describe('memeDetailMachine reloads during actions', () => {
  it('keeps a reload in its active action phase and settles each action on DONE', () => {
    for (const action of [
      { event: { type: 'LIST' } as const, phase: 'listing' },
      { event: { type: 'BUY' } as const, phase: 'buying' },
      { event: { type: 'DELETE' } as const, phase: 'deleting' },
    ]) {
      const actor = readyActor()
      actor.send(action.event)
      actor.send({ type: 'LOADED', meme: reloadedMeme, positions: reloadedPositions })

      expect(actor.getSnapshot().value).toBe(action.phase)
      expect(actor.getSnapshot().context).toMatchObject({
        meme: reloadedMeme,
        positions: reloadedPositions,
        err: null,
      })

      actor.send({ type: 'DONE' })
      expect(actor.getSnapshot().value).toBe('ready')
      actor.stop()
    }
  })

  it('keeps reload failures on the active action cleanup path', () => {
    for (const action of [
      { event: { type: 'LIST' } as const, phase: 'listing' },
      { event: { type: 'BUY' } as const, phase: 'buying' },
      { event: { type: 'DELETE' } as const, phase: 'deleting' },
    ]) {
      const actor = readyActor()
      if (action.phase === 'deleting') actor.send({ type: 'SET_CONFIRMING_DELETE', confirming: true })
      actor.send(action.event)
      actor.send({ type: 'LOADED', meme: reloadedMeme, positions: reloadedPositions })
      actor.send({ type: 'FAIL', err: 'request conflicted' })

      expect(actor.getSnapshot().value).toBe('error')
      expect(actor.getSnapshot().context.err).toBe('request conflicted')
      if (action.phase === 'deleting') {
        expect(actor.getSnapshot().context).toMatchObject({ deleting: false, confirmingDelete: false })
      }
      actor.stop()
    }
  })

  it('clamps money-adjacent inputs where the state lives', () => {
    const listed = { ...meme, listing: { sellerId: 'owner-a', pricePerShare: 4, shares: 10 } }
    const actor = createActor(memeDetailMachine, { input: { id: meme.id } }).start()
    actor.send({ type: 'LOADED', meme: listed, positions })

    actor.send({ type: 'SET_BUY_SHARES', shares: Number('') })
    expect(actor.getSnapshot().context.buyShares).toBe(0)
    actor.send({ type: 'SET_BUY_SHARES', shares: 99 })
    expect(actor.getSnapshot().context.buyShares).toBe(10)
    actor.send({ type: 'SET_BUY_SHARES', shares: 2.7 })
    expect(actor.getSnapshot().context.buyShares).toBe(2)

    actor.send({ type: 'SET_SELL_SHARES', shares: -5 })
    expect(actor.getSnapshot().context.sellShares).toBe(0)

    actor.send({ type: 'SET_PRICE', price: -3 })
    expect(actor.getSnapshot().context.price).toBe(0)
    actor.send({ type: 'SET_PRICE', price: 1.239 })
    expect(actor.getSnapshot().context.price).toBe(1.24)
    actor.send({ type: 'SET_PRICE', price: 10_000_000 })
    expect(actor.getSnapshot().context.price).toBe(999_999)
    actor.stop()

    expect(clampShares(Number.NaN, 10)).toBe(0)
    expect(clampPrice(Number.NaN)).toBe(0)
  })

  it('keeps the memeplex notice and error channels exclusive', () => {
    const actor = readyActor()
    actor.send({ type: 'SET_PLEX_MSG', msg: 'Added to the memeplex 🕸️' })
    expect(actor.getSnapshot().context).toMatchObject({ plexMsg: 'Added to the memeplex 🕸️', plexErr: null })

    actor.send({ type: 'SET_PLEX_ERR', err: 'Already in the memeplex.' })
    expect(actor.getSnapshot().context).toMatchObject({ plexMsg: null, plexErr: 'Already in the memeplex.' })
    actor.stop()
  })

  it('resolves every holder name in one batch', () => {
    const actor = readyActor()
    actor.send({ type: 'SET_HOLDER_NAMES', names: { 'holder-b': 'Pal', 'holder-c': 'Bud' } })
    actor.send({ type: 'SET_HOLDER_NAMES', names: { 'holder-d': 'Chum' } })
    expect(actor.getSnapshot().context.holderNames).toEqual({ 'holder-b': 'Pal', 'holder-c': 'Bud', 'holder-d': 'Chum' })
    actor.stop()
  })

  it('keeps initial load and not-found behavior unchanged', () => {
    const actor = createActor(memeDetailMachine, { input: { id: meme.id } }).start()
    expect(actor.getSnapshot().value).toBe('loading')

    actor.send({ type: 'NOT_FOUND' })
    expect(actor.getSnapshot().value).toBe('empty')

    actor.send({ type: 'LOADED', meme, positions })
    expect(actor.getSnapshot().value).toBe('ready')
    actor.stop()
  })
})
