// Semantic meme search: Titan v2 embeddings (256-dim) + S3 Vectors index.
// The index only holds public memes — private/deleted memes are removed at
// write time, so queries return candidate ids that just need hydration.
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import {
  S3VectorsClient,
  PutVectorsCommand,
  QueryVectorsCommand,
  DeleteVectorsCommand,
} from '@aws-sdk/client-s3vectors'
import { env } from './env'
import type { Meme } from './types'

const bedrock = new BedrockRuntimeClient({})
const vectors = new S3VectorsClient({})

const INDEX = { vectorBucketName: env.vectorBucket, indexName: 'memes' }
const EMBED_MODEL = 'amazon.titan-embed-text-v2:0'
const DIMENSIONS = 256

export async function embedText(text: string): Promise<number[]> {
  const res = await bedrock.send(
    new InvokeModelCommand({
      modelId: EMBED_MODEL,
      contentType: 'application/json',
      body: JSON.stringify({
        inputText: text.slice(0, 2000),
        dimensions: DIMENSIONS,
        normalize: true,
      }),
    }),
  )
  const parsed = JSON.parse(new TextDecoder().decode(res.body)) as { embedding: number[] }
  return parsed.embedding
}

export const memeText = (m: Meme): string =>
  [m.title, (m.tags ?? []).join(' '), m.description ?? ''].filter(Boolean).join('\n')

/** Add or refresh a meme in the search index. Callers treat failures as non-fatal. */
export async function indexMeme(meme: Meme): Promise<void> {
  if (meme.private) return
  const embedding = await embedText(memeText(meme))
  await vectors.send(
    new PutVectorsCommand({
      ...INDEX,
      vectors: [{ key: meme.id, data: { float32: embedding } }],
    }),
  )
}

export async function removeFromIndex(memeId: string): Promise<void> {
  await vectors.send(new DeleteVectorsCommand({ ...INDEX, keys: [memeId] }))
}

/** Top-k meme ids by semantic similarity, best match first. */
export async function searchIds(query: string, topK: number): Promise<string[]> {
  const embedding = await embedText(query)
  const res = await vectors.send(
    new QueryVectorsCommand({
      ...INDEX,
      queryVector: { float32: embedding },
      topK,
      returnDistance: false,
      returnMetadata: false,
    }),
  )
  return (res.vectors ?? []).map((v) => v.key).filter((k): k is string => !!k)
}
