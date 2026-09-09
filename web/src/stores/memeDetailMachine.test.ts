import { createActor } from 'xstate'
import { describe, expect, it } from 'vitest'
import { tierFor } from '../../../shared/tiers'
import type { Meme, Position } from '../lib/types'
import { memeDetailMachine } from './memeDetailMachine'

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
