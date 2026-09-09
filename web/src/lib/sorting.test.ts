import { describe, expect, it } from 'vitest'
import { tierFor } from '../../../shared/tiers'
import { sortMemes } from './sorting'
import type { Meme } from './types'

function meme(id: string, values: Partial<Meme>): Meme {
  return {
    id,
    title: id,
    description: null,
    mediaType: 'image',
    imageUrl: `/${id}.png`,
    videoUrl: null,
    tags: [],
    creatorId: 'creator',
    creatorName: 'creator',
    ownerId: 'owner',
    ownerName: 'owner',
    reshares: 0,
    tierKey: 'paper',
    listing: null,
    createdAt: '2026-09-08T00:00:00.000Z',
    tier: tierFor(0),
    value: 0,
    ...values,
  }
}

describe('sortMemes', () => {
  it('sorts a readonly input without mutating it', () => {
    const older = meme('older', { createdAt: '2026-09-01T00:00:00.000Z' })
    const newer = meme('newer', { createdAt: '2026-09-08T00:00:00.000Z' })
    const input = [older, newer] as const

    expect(sortMemes(input, 'new', 'desc')).toEqual([newer, older])
    expect(input).toEqual([older, newer])
  })

  it('uses the incumbent fallback values for views and reshares', () => {
    const fallback = meme('fallback', { reshares: 8 })
    const explicit = meme('explicit', { reshares: 20, views: 2, reshareCount: 1 })

    expect(sortMemes([explicit, fallback], 'views', 'desc')).toEqual([fallback, explicit])
    expect(sortMemes([fallback, explicit], 'reshares', 'desc')).toEqual([explicit, fallback])
  })

  it('sorts numeric values in either direction', () => {
    const low = meme('low', { value: 2 })
    const high = meme('high', { value: 10 })

    expect(sortMemes([low, high], 'value', 'desc')).toEqual([high, low])
    expect(sortMemes([low, high], 'value', 'asc')).toEqual([low, high])
  })
})
