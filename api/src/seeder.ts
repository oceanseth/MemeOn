// Scheduled Giphy archive seeder (EventBridge → lambda with {action:"giphy-seed"}).
// Tops the Meme Archive up each run, rotating search themes by hour so the
// inventory stays varied, and stops while unclaimed stock is at target.
import { randomUUID } from 'node:crypto'
import * as db from './db'
import { search } from './giphy'
import { TIERS } from '../../shared/tiers'
import type { Meme } from './types'

const SEED_TERMS = [
  'classic meme', 'doge meme', 'cat meme', 'reaction meme', 'fail meme', 'dance meme',
  'dog meme', 'office meme', 'gaming meme', 'monday meme', 'coffee meme', 'gym meme',
  'awkward meme', 'celebration gif', 'facepalm', 'mind blown', 'deal with it', 'eye roll',
  'happy dance', 'sad cat', 'excited gif', 'confused gif', 'thumbs up gif', 'crying laughing',
]

const DEFAULT_MAX_PER_RUN = 100
const DEFAULT_INVENTORY_TARGET = 400

export async function runGiphySeed(opts: {
  max?: number
  inventoryTarget?: number
}): Promise<{ seeded: number; inventory: number; skipped: boolean }> {
  const max = Math.min(opts.max ?? DEFAULT_MAX_PER_RUN, 200)
  const target = opts.inventoryTarget ?? DEFAULT_INVENTORY_TARGET

  await db.ensureUser({ sub: db.ARCHIVE_SUB, name: 'Meme Archive', picture: null })
  const existing = await db.listMemes(1000)
  const unclaimed = existing.filter(
    (m) => m.creatorId === db.ARCHIVE_SUB && m.ownerId === db.ARCHIVE_SUB,
  ).length
  if (unclaimed >= target) {
    return { seeded: 0, inventory: unclaimed, skipped: true }
  }
  const room = Math.min(max, target - unclaimed)
  const seenGiphyIds = new Set(
    existing.filter((m) => m.source?.provider === 'giphy').map((m) => m.source!.id),
  )

  // rotate through the term list by hour so consecutive runs pull different themes
  const hour = new Date().getUTCHours()
  const terms = Array.from({ length: 6 }, (_, i) => SEED_TERMS[(hour * 6 + i) % SEED_TERMS.length])

  let seeded = 0
  for (const term of terms) {
    if (seeded >= room) break
    const results = await search(term, 24).catch(() => [])
    for (const gif of results) {
      if (seeded >= room) break
      if (seenGiphyIds.has(gif.id) || !gif.mp4Url) continue
      seenGiphyIds.add(gif.id)
      const meme: Meme = {
        id: randomUUID().slice(0, 12),
        title: gif.title.slice(0, 20) || 'Classic Meme',
        description: `From the Meme Archive · via GIPHY${gif.author ? ` (@${gif.author})` : ''}`,
        mediaType: 'video',
        imageUrl: gif.stillUrl,
        videoUrl: gif.mp4Url,
        tags: ['archive', term.split(' ')[0]],
        creatorId: db.ARCHIVE_SUB,
        creatorName: 'Meme Archive',
        ownerId: db.ARCHIVE_SUB,
        ownerName: 'Meme Archive',
        reshares: 0,
        tierKey: TIERS[0].key,
        listing: null,
        createdAt: new Date().toISOString(),
        remixOf: null,
        private: false,
        source: { provider: 'giphy', id: gif.id, url: gif.url, author: gif.author },
      }
      await db.putMeme(meme)
      await db.putPosition(meme.id, db.ARCHIVE_SUB, 100)
      seeded++
    }
  }
  return { seeded, inventory: unclaimed + seeded, skipped: false }
}
