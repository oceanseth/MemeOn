// Manually pull a specific topic into the Meme Archive (markers + counter +
// instant listing, same as the hourly seeder).
// Usage: TABLE_NAME=... SSM_PREFIX=... AWS_REGION=us-west-2 npx tsx scripts/seed-term.ts "geek" [count]
import * as db from '../src/db'
import { mintArchiveGif } from '../src/archiveMint'
import { search } from '../src/giphy'

const base = process.argv[2]
if (!base) throw new Error('usage: seed-term.ts <term> [count]')
const want = Math.min(Number(process.argv[3]) || 15, 40)
const terms = [base, `${base} meme`, `${base}y`, `${base} reaction`]

await db.ensureUser({
  sub: db.ARCHIVE_SUB,
  name: 'Meme Archive',
  picture: null,
})
let seeded = 0
for (const term of terms) {
  if (seeded >= want) break
  for (const gif of await search(term, 20).catch(() => [])) {
    if (seeded >= want) break
    if (await mintArchiveGif(gif, base)) {
      console.log(`archived: ${gif.title.slice(0, 20) || 'Classic Meme'} [${term}]`)
      seeded++
    }
  }
}
if (seeded > 0) await db.bumpArchiveSeedCount(seeded)
console.log(`done: ${seeded} '${base}' memes`)
process.exit(0)
