// Manually pull a specific topic into the Meme Archive (markers + counter +
// instant listing, same as the hourly seeder).
// Usage: TABLE_NAME=... SSM_PREFIX=... AWS_REGION=us-west-2 npx tsx scripts/seed-term.ts "geek" [count]
import { randomUUID } from 'node:crypto'
import * as db from '../src/db'
import { search } from '../src/giphy'
import { TIERS } from '../../shared/tiers'
import type { Meme } from '../src/types'

const base = process.argv[2]
if (!base) throw new Error('usage: seed-term.ts <term> [count]')
const want = Math.min(Number(process.argv[3]) || 15, 40)
const terms = [base, `${base} meme`, `${base}y`, `${base} reaction`]

await db.ensureUser({ sub: db.ARCHIVE_SUB, name: 'Meme Archive', picture: null })
let seeded = 0
for (const term of terms) {
  if (seeded >= want) break
  for (const gif of await search(term, 20).catch(() => [])) {
    if (seeded >= want) break
    if (!gif.mp4Url) continue
    if (!(await db.markGiphySeeded(gif.id))) continue
    const meme: Meme = {
      id: randomUUID().slice(0, 12),
      title: gif.title.slice(0, 20) || 'Classic Meme',
      description: `From the Meme Archive · via GIPHY${gif.author ? ` (@${gif.author})` : ''}`,
      mediaType: 'video',
      imageUrl: gif.stillUrl,
      videoUrl: gif.mp4Url,
      tags: ['archive', base],
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
    await db.setListing(meme.id, { sellerId: db.ARCHIVE_SUB, pricePerShare: 0.1, shares: 100 })
    console.log(`archived: ${meme.title} [${term}]`)
    seeded++
  }
}
if (seeded > 0) await db.bumpArchiveSeedCount(seeded)
console.log(`done: ${seeded} '${base}' memes`)
process.exit(0)
