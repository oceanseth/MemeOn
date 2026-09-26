// One-shot: stamp intrinsic media dimensions (width/height of `imageUrl`) onto memes
// that predate the fields. Giphy-sourced memes ask the Giphy API by source id; everything
// else gets its image header measured over HTTP. Writes are conditional on
// `attribute_not_exists(width)`, so the script is idempotent and never races a mint.
//
// Usage: TABLE_NAME=memeon-dev SSM_PREFIX=/memeon/dev AWS_REGION=us-west-2 \
//          npx tsx scripts/backfill-media-dims.ts [--dry-run]
//
// Run against dev only; production needs an explicit go from Lou.
import * as db from '../src/db'
import * as giphy from '../src/giphy'
import { measureImageUrl, type ImageSize } from '../src/imageSize'

const dryRun = process.argv.includes('--dry-run')
const CONCURRENCY = 8

let scanned = 0
let hadDims = 0
let fromGiphy = 0
let measured = 0
let skippedWrite = 0
let failed = 0

async function resolveDims(meme: {
  imageUrl: string
  source?: { provider: string; id: string } | null
}): Promise<{ dims: ImageSize | null; via: 'giphy' | 'measure' }> {
  if (meme.source?.provider === 'giphy') {
    const gif = await giphy.getById(meme.source.id).catch(() => null)
    if (gif?.width && gif.height) {
      return { dims: { width: gif.width, height: gif.height }, via: 'giphy' }
    }
  }
  return { dims: await measureImageUrl(meme.imageUrl), via: 'measure' }
}

async function processMeme(meme: Awaited<ReturnType<typeof db.listMemesPage>>['memes'][number]) {
  scanned++
  if (meme.width && meme.height) {
    hadDims++
    return
  }
  const { dims, via } = await resolveDims(meme)
  if (!dims) {
    failed++
    console.log(`  ✗ ${meme.id} ${via} failed: ${meme.imageUrl}`)
    return
  }
  if (dryRun) {
    via === 'giphy' ? fromGiphy++ : measured++
    console.log(`  (dry) ${meme.id} ${dims.width}x${dims.height} via ${via}`)
    return
  }
  if (await db.setMemeDimsIfAbsent(meme.id, dims.width, dims.height)) {
    via === 'giphy' ? fromGiphy++ : measured++
  } else {
    skippedWrite++
  }
}

let cursor: string | null = null
do {
  const page: Awaited<ReturnType<typeof db.listMemesPage>> = await db.listMemesPage({
    cursor,
    limit: 200,
  })
  // bounded concurrency: CONCURRENCY memes in flight at a time
  for (let i = 0; i < page.memes.length; i += CONCURRENCY) {
    await Promise.all(page.memes.slice(i, i + CONCURRENCY).map(processMeme))
  }
  cursor = page.nextCursor
  console.log(`scanned ${scanned}…`)
} while (cursor)

console.log(
  `${dryRun ? '[dry-run] ' : ''}scanned: ${scanned}, already had dims: ${hadDims}, ` +
    `giphy: ${fromGiphy}, measured: ${measured}, write-skipped: ${skippedWrite}, failed: ${failed}`,
)
process.exit(0)
