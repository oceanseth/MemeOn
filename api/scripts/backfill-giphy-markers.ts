// One-shot: write GIPHY# seed markers for already-minted archive memes and
// initialize the ARCHIVE#STATS counter, so the marker-based dedup covers
// everything seeded before markers existed.
//
// Usage: TABLE_NAME=memeon-production SSM_PREFIX=/memeon/production \
//          AWS_REGION=us-west-2 npx tsx scripts/backfill-giphy-markers.ts
import * as db from '../src/db'

let cursor: string | null = null
let markers = 0
let archiveMemes = 0
do {
  const page: Awaited<ReturnType<typeof db.listMemesPage>> = await db.listMemesPage({
    cursor,
    limit: 200,
  })
  for (const m of page.memes) {
    if (m.creatorId === db.ARCHIVE_SUB) archiveMemes++
    if (m.source?.provider === 'giphy') {
      if (await db.markGiphySeeded(m.source.id)) markers++
    }
  }
  cursor = page.nextCursor
} while (cursor)

const current = await db.archiveSeedCount()
if (current < archiveMemes) await db.bumpArchiveSeedCount(archiveMemes - current)
console.log(`markers written: ${markers}, archive memes counted: ${archiveMemes}`)
process.exit(0)
