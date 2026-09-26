// Shared archive Giphy mint (hourly seeder + CLI scripts).
import { randomUUID } from 'node:crypto'
import * as db from './db'
import { indexMeme } from './vectors'
import { TIERS } from '@memeon/shared/tiers'
import type { GiphyResult } from './giphy'
import type { Meme } from './types'

export async function mintArchiveGif(gif: GiphyResult, tag: string): Promise<boolean> {
  if (!gif.mp4Url) return false
  // permanent marker record — never mint the same gif twice, ever
  if (!(await db.markGiphySeeded(gif.id))) return false
  const meme: Meme = {
    id: randomUUID().slice(0, 12),
    title: gif.title.slice(0, 20) || 'Classic Meme',
    description: `From the Meme Archive · via GIPHY${gif.author ? ` (@${gif.author})` : ''}`,
    mediaType: 'video',
    imageUrl: gif.stillUrl,
    videoUrl: gif.mp4Url,
    tags: ['archive', tag.split(' ')[0]],
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
    // giphy's original dims — the still shares the clip's aspect, which is all masonry needs
    width: gif.width ?? undefined,
    height: gif.height ?? undefined,
  }
  await db.putMeme(meme)
  await indexMeme(meme).catch(() => {})
  await db.putPosition(meme.id, db.ARCHIVE_SUB, 100)
  // archive stock goes straight on the market: 10 shares for 1 braincell
  await db.setListing(meme.id, {
    sellerId: db.ARCHIVE_SUB,
    pricePerShare: 0.1,
    shares: 100,
  })
  return true
}
