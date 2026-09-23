import { createActor } from 'xstate'
import { describe, expect, it } from 'vitest'
import { tierFor } from '@memeon/shared/tiers'
import type { Meme } from '../lib/types'
import { marketplaceMachine, type MarketplaceInput } from './marketplaceMachine'

function memeFor(id: string): Meme {
  return {
    id,
    title: id,
    description: null,
    mediaType: 'image',
    imageUrl: `https://example.test/${id}.png`,
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
}

const memeA = memeFor('meme-a')
const memeB = memeFor('meme-b')
const memeC = memeFor('meme-c')

function startMarket(input: MarketplaceInput = {}) {
  return createActor(marketplaceMachine, { input }).start()
}

describe('marketplaceMachine', () => {
  it('starts loading with idle busy and default filters', () => {
    const actor = startMarket()
    expect(actor.getSnapshot().value).toBe('loading')
    expect(actor.getSnapshot().context).toEqual({
      memes: [],
      nextCursor: null,
      q: '',
      type: '',
      tier: '',
      listed: false,
      sortKey: 'new',
      sortDir: 'desc',
      err: null,
      moreErr: null,
      busy: 'idle',
      filtersOpen: false,
    })
    actor.stop()
  })

  it('hydrates MarketplaceInput and defaults omitted keys', () => {
    const actor = startMarket({
      q: 'cats',
      type: 'video',
      listed: true,
      sortDir: 'asc',
    })
    expect(actor.getSnapshot().value).toBe('loading')
    expect(actor.getSnapshot().context).toMatchObject({
      q: 'cats',
      type: 'video',
      tier: '',
      listed: true,
      sortKey: 'new',
      sortDir: 'asc',
      memes: [],
      nextCursor: null,
      err: null,
      moreErr: null,
      busy: 'idle',
      filtersOpen: false,
    })
    actor.stop()
  })

  it('LOADED with memes enters ready and idles', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [memeA], nextCursor: 'c1' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [memeA],
      nextCursor: 'c1',
      busy: 'idle',
      err: null,
      moreErr: null,
    })
    actor.stop()
  })

  // Guard is memes.length === 0 only. Sparse pages APPEND; do not treat a cursor as ready.
  it('LOADED with empty memes enters empty even when nextCursor is set', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [], nextCursor: 'c-sparse' })
    expect(actor.getSnapshot().value).toBe('empty')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [],
      nextCursor: 'c-sparse',
      busy: 'idle',
      err: null,
      moreErr: null,
    })
    actor.stop()
  })

  // FAIL wipes the list from ready. Filters stay; do not keep cards.
  it('FAIL from ready wipes memes and cursor but keeps filters', () => {
    const actor = startMarket({
      q: 'cats',
      type: 'image',
      tier: 'gold',
      listed: true,
      sortKey: 'views',
      sortDir: 'asc',
    })
    actor.send({ type: 'LOADED', memes: [memeA], nextCursor: 'c1' })
    actor.send({ type: 'FAIL', err: 'network down' })
    expect(actor.getSnapshot().value).toBe('error')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [],
      nextCursor: null,
      err: 'network down',
      moreErr: null,
      busy: 'idle',
      q: 'cats',
      type: 'image',
      tier: 'gold',
      listed: true,
      sortKey: 'views',
      sortDir: 'asc',
    })
    actor.stop()
  })

  it('FETCHING refresh from ready keeps phase, memes, and moreErr', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [memeA], nextCursor: 'c1' })
    actor.send({ type: 'MORE_FAILED', err: 'page failed' })
    actor.send({ type: 'FETCHING', scope: 'refresh' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [memeA],
      nextCursor: 'c1',
      busy: 'refresh',
      moreErr: 'page failed',
    })
    actor.stop()
  })

  it('FETCHING more from ready keeps memes, sets busy more, and clears moreErr', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [memeA], nextCursor: 'c1' })
    actor.send({ type: 'MORE_FAILED', err: 'page failed' })
    actor.send({ type: 'FETCHING', scope: 'more' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [memeA],
      nextCursor: 'c1',
      busy: 'more',
      moreErr: null,
    })
    actor.stop()
  })

  it('APPEND concatenates unique ids, updates cursor, and idles without changing phase', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [memeA, memeB], nextCursor: 'c1' })
    actor.send({ type: 'MORE_FAILED', err: 'page failed' })
    actor.send({ type: 'APPEND', memes: [memeB, memeC], nextCursor: 'c2' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [memeA, memeB, memeC],
      nextCursor: 'c2',
      busy: 'idle',
      moreErr: null,
    })
    actor.stop()
  })

  it('APPEND after an empty load, a failed continuation, then new ids enters ready', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [], nextCursor: 'c-sparse' })
    actor.send({ type: 'FETCHING', scope: 'more' })
    actor.send({ type: 'MORE_FAILED', err: 'page failed' })
    actor.send({ type: 'APPEND', memes: [memeA], nextCursor: 'c2' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [memeA],
      nextCursor: 'c2',
      busy: 'idle',
      moreErr: null,
    })
    actor.stop()
  })

  it('APPEND of an empty page from empty stays empty and writes the cursor', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [], nextCursor: 'c-sparse' })
    actor.send({ type: 'APPEND', memes: [], nextCursor: 'c-next' })
    expect(actor.getSnapshot().value).toBe('empty')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [],
      nextCursor: 'c-next',
      busy: 'idle',
    })
    actor.stop()
  })

  it('APPEND of an empty page from ready stays ready, keeps memes, and clears moreErr', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [memeA, memeB], nextCursor: 'c1' })
    actor.send({ type: 'MORE_FAILED', err: 'page failed' })
    actor.send({ type: 'APPEND', memes: [], nextCursor: 'c2' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [memeA, memeB],
      nextCursor: 'c2',
      busy: 'idle',
      moreErr: null,
    })
    actor.stop()
  })

  it('APPEND of only duplicates from ready stays ready and does not drop ids', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [memeA, memeB], nextCursor: 'c1' })
    actor.send({ type: 'APPEND', memes: [memeA, memeB], nextCursor: 'c2' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context.memes.map((meme) => meme.id)).toEqual(['meme-a', 'meme-b'])
    expect(actor.getSnapshot().context).toMatchObject({
      nextCursor: 'c2',
      busy: 'idle',
      moreErr: null,
    })
    actor.stop()
  })

  it('MORE_FAILED sets moreErr and idles without wiping memes, cursor, or phase', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [memeA], nextCursor: 'c1' })
    actor.send({ type: 'FETCHING', scope: 'more' })
    actor.send({ type: 'MORE_FAILED', err: 'page failed' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [memeA],
      nextCursor: 'c1',
      moreErr: 'page failed',
      busy: 'idle',
      err: null,
    })
    actor.stop()
  })

  it('CLEAR_FILTERS resets q, type, tier, and listed only', () => {
    const actor = startMarket({
      q: 'cats',
      type: 'video',
      tier: 'gold',
      listed: true,
      sortKey: 'views',
      sortDir: 'asc',
    })
    actor.send({ type: 'LOADED', memes: [memeA], nextCursor: 'c1' })
    actor.send({ type: 'TOGGLE_FILTERS' })
    actor.send({ type: 'FETCHING', scope: 'refresh' })
    actor.send({ type: 'CLEAR_FILTERS' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      q: '',
      type: '',
      tier: '',
      listed: false,
      sortKey: 'views',
      sortDir: 'asc',
      memes: [memeA],
      nextCursor: 'c1',
      busy: 'refresh',
      filtersOpen: true,
    })
    actor.stop()
  })

  it('SET_SORT writes sortKey and sortDir without changing phase', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [memeA], nextCursor: null })
    actor.send({ type: 'SET_SORT', sortKey: 'value', sortDir: 'asc' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      sortKey: 'value',
      sortDir: 'asc',
      memes: [memeA],
    })
    actor.stop()
  })

  it('SET_Q, SET_TYPE, SET_TIER, SET_LISTED, and TOGGLE_FILTERS assign without changing phase', () => {
    const actor = startMarket()
    actor.send({ type: 'LOADED', memes: [memeA], nextCursor: 'c1' })
    actor.send({ type: 'SET_Q', q: 'dogs' })
    actor.send({ type: 'SET_TYPE', value: 'video' })
    actor.send({ type: 'SET_TIER', value: 'silver' })
    actor.send({ type: 'SET_LISTED', listed: true })
    actor.send({ type: 'TOGGLE_FILTERS' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      q: 'dogs',
      type: 'video',
      tier: 'silver',
      listed: true,
      filtersOpen: true,
      memes: [memeA],
      nextCursor: 'c1',
      busy: 'idle',
    })
    actor.send({ type: 'TOGGLE_FILTERS' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context.filtersOpen).toBe(false)
    actor.stop()
  })

  it('recovers from error via LOADED to ready or empty without a RETRY event', () => {
    const actor = startMarket()
    actor.send({ type: 'FAIL', err: 'boom' })
    expect(actor.getSnapshot().value).toBe('error')
    actor.send({ type: 'LOADED', memes: [memeA], nextCursor: 'c1' })
    expect(actor.getSnapshot().value).toBe('ready')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [memeA],
      nextCursor: 'c1',
      err: null,
      moreErr: null,
      busy: 'idle',
    })

    actor.send({ type: 'FAIL', err: 'boom again' })
    expect(actor.getSnapshot().value).toBe('error')
    actor.send({ type: 'LOADED', memes: [], nextCursor: null })
    expect(actor.getSnapshot().value).toBe('empty')
    expect(actor.getSnapshot().context).toMatchObject({
      memes: [],
      err: null,
      busy: 'idle',
    })
    actor.stop()
  })
})
