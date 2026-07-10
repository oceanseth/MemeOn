// Backfill: put every archive-held meme on the market (10 shares / 1 🧠) if it
// isn't already listed. Safe to re-run.
//
// Usage: TABLE_NAME=memeon-production SSM_PREFIX=/memeon/production \
//          AWS_REGION=us-west-2 npx tsx scripts/list-archive.ts
import * as db from '../src/db'

const memes = await db.listMemes(1000)
let listed = 0
for (const meme of memes.filter((m) => m.creatorId === db.ARCHIVE_SUB && !m.private)) {
  if (meme.listing && meme.listing.shares > 0) continue
  const positions = await db.getPositions(meme.id)
  const held = positions.find((p) => p.userId === db.ARCHIVE_SUB)?.shares ?? 0
  if (held <= 0) continue
  await db.setListing(meme.id, { sellerId: db.ARCHIVE_SUB, pricePerShare: 0.1, shares: held })
  listed++
}
console.log(`listed ${listed} archive memes at 0.1🧠/share`)
process.exit(0)
