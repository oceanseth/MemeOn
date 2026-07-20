// One-time (idempotent, re-runnable) backfill of CREATED#<sub> edge items for
// every existing meme, so profile "Created" tabs work without scanning memes.
//
// Usage: TABLE_NAME=memeon-dev AWS_REGION=us-west-2 npx tsx scripts/backfill-created-edges.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import * as db from '../src/db'
import { env } from '../src/env'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
})

let cursor: string | null = null
let total = 0
do {
  const { memes, nextCursor } = await db.listMemesPage({ cursor, limit: 500 })
  const items = memes.map((m) => db.createdEdgeItem(m.creatorId, m.createdAt, m.id))
  for (let i = 0; i < items.length; i += 25) {
    let requests = items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } }))
    while (requests.length > 0) {
      const res = await ddb.send(new BatchWriteCommand({ RequestItems: { [env.tableName]: requests } }))
      requests = (res.UnprocessedItems?.[env.tableName] ?? []) as typeof requests
    }
  }
  total += memes.length
  cursor = nextCursor
  console.log(`backfilled ${total} created edges`)
} while (cursor)
console.log('done')
process.exit(0)
