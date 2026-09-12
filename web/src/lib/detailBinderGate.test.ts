import { expect, test } from 'vitest'
import { tierFor } from '@memeon/shared/tiers'
import { createDetailBinderGate } from './detailBinderGate'
import type { Meme } from './types'

const meme: Meme = { id: 'meme-a', title: 'A', description: null, mediaType: 'image', imageUrl: 'https://example.test/a.png', videoUrl: null, tags: [], creatorId: 'creator', creatorName: 'Creator', ownerId: 'creator', ownerName: 'Creator', reshares: 0, tierKey: 'paper', listing: null, createdAt: '2026-01-01T00:00:00.000Z', tier: tierFor(0), value: 1 }

test('binder request waits for either arrival order and rerenders only request once per eligible user', () => {
  const gate = createDetailBinderGate()
  const positions = [{ memeId: meme.id, userId: 'holder', shares: 10 }]

  expect(gate.shouldLoad(null, positions, 'holder')).toBe(false)
  expect(gate.shouldLoad(meme, positions, null)).toBe(false)
  expect(gate.shouldLoad(meme, positions, 'holder')).toBe(true)
  expect(gate.shouldLoad(meme, positions, 'holder')).toBe(false)
  expect(gate.shouldLoad(meme, positions, 'other')).toBe(false)
  expect(gate.shouldLoad(meme, positions, 'creator')).toBe(true)
})
