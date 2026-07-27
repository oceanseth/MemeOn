// One-time (idempotent, re-runnable) backfill of the S3 Vectors semantic search
// index: embeds every public meme with Titan v2 and PutVectors in batches.
//
// Usage: TABLE_NAME=memeon-dev VECTOR_BUCKET=memeon-vectors-dev AWS_REGION=us-west-2 \
//          npx tsx scripts/backfill-vectors.ts
import {
  S3VectorsClient,
  PutVectorsCommand,
} from '@aws-sdk/client-s3vectors'
import * as db from '../src/db'
import { env } from '../src/env'
import { embedText, memeText } from '../src/vectors'

const vectors = new S3VectorsClient({})
const INDEX = { vectorBucketName: env.vectorBucket, indexName: 'memes' }

let cursor: string | null = null
let total = 0
let skipped = 0
do {
  const { memes, nextCursor } = await db.listMemesPage({ cursor, limit: 200 })
  const publicMemes = memes.filter((m) => !m.private)
  skipped += memes.length - publicMemes.length
  // embed a handful at a time to stay clear of Bedrock throttling
  for (let i = 0; i < publicMemes.length; i += 10) {
    const chunk = publicMemes.slice(i, i + 10)
    const embedded = await Promise.all(
      chunk.map(async (m) => ({ key: m.id, data: { float32: await embedText(memeText(m)) } })),
    )
    await vectors.send(new PutVectorsCommand({ ...INDEX, vectors: embedded }))
    total += chunk.length
  }
  cursor = nextCursor
  console.log(`indexed ${total} memes (${skipped} private skipped)`)
} while (cursor)
console.log(`done: ${total} indexed into ${env.vectorBucket}/memes`)
process.exit(0)
