// Seed the Meme Archive with classic memes from Giphy (with attribution).
// Cards are owned by the archive house account until a creator claims them.
//
// Key resolution: GIPHY_API_KEY env → SSM /memeon/shared/giphy_api_key → Giphy
// public beta key (rate-limited; fine for one-off seeding).
//
// Usage: TABLE_NAME=memeon-dev SSM_PREFIX=/memeon/dev AWS_REGION=us-west-2 \
//          npx tsx scripts/seed-giphy.ts [count]
import { randomUUID } from 'node:crypto'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import * as db from '../src/db'
import { TIERS } from '../../shared/tiers'
import type { Meme } from '../src/types'

const SEARCHES = ['classic meme', 'doge meme', 'cat meme', 'reaction meme', 'fail meme', 'dance meme']
const COUNT = Math.min(Number(process.argv[2]) || 20, 50) // batches of 20 by default

async function giphyKey(): Promise<string> {
  if (process.env.GIPHY_API_KEY) return process.env.GIPHY_API_KEY
  try {
    const ssm = new SSMClient({})
    const res = await ssm.send(
      new GetParameterCommand({ Name: '/memeon/shared/giphy_api_key', WithDecryption: true }),
    )
    if (res.Parameter?.Value) return res.Parameter.Value
  } catch {
    /* fall through */
  }
  return 'dc6zaTOxFJmzC' // giphy public beta key
}

interface GiphyGif {
  id: string
  title: string
  url: string
  username: string
  images: {
    original: { mp4?: string }
    downsized_still?: { url?: string }
    original_still?: { url?: string }
    downsized_medium?: { url?: string }
  }
}

const key = await giphyKey()

// preflight: fail loudly with the fix, instead of 403-ing through every search
const ping = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=test&limit=1`)
if (!ping.ok) {
  console.error(`
❌ Giphy rejected the API key (HTTP ${ping.status}).
   ${key === 'dc6zaTOxFJmzC' ? 'No key is configured, and Giphy retired the public beta key.' : 'The configured key is invalid or rate-limited.'}

   Fix (≈2 min):
   1. Get a free key: https://developers.giphy.com → Create an App → API
   2. aws ssm put-parameter --region us-west-2 --type SecureString \\
        --name /memeon/shared/giphy_api_key --value "YOUR_KEY"
   3. Re-run this script.
`)
  process.exit(1)
}

await db.ensureUser({ sub: db.ARCHIVE_SUB, name: 'Meme Archive', picture: null })
const existing = await db.listMemes()
const existingGiphyIds = new Set(
  existing.filter((m) => m.source?.provider === 'giphy').map((m) => m.source!.id),
)

const picked: GiphyGif[] = []
for (const q of SEARCHES) {
  if (picked.length >= COUNT) break
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=10&rating=pg-13`,
  )
  const data = (await res.json()) as { data?: GiphyGif[]; message?: string }
  if (!res.ok || !data.data) {
    console.error(`giphy search "${q}" failed: ${res.status} ${data.message ?? ''}`)
    continue
  }
  for (const gif of data.data) {
    if (picked.length >= COUNT) break
    if (existingGiphyIds.has(gif.id) || picked.some((p) => p.id === gif.id)) continue
    if (!gif.images.original.mp4) continue
    picked.push(gif)
  }
}

console.log(`seeding ${picked.length} archive memes`)
for (const gif of picked) {
  const title =
    (gif.title || 'Classic Meme').replace(/\s*GIF.*$/i, '').trim().slice(0, 20) || 'Classic Meme'
  const still =
    gif.images.downsized_still?.url ?? gif.images.original_still?.url ?? gif.images.downsized_medium?.url
  if (!still) continue
  const meme: Meme = {
    id: randomUUID().slice(0, 12),
    title,
    description: `From the Meme Archive · via GIPHY${gif.username ? ` (@${gif.username})` : ''}`,
    mediaType: 'video',
    imageUrl: still,
    videoUrl: gif.images.original.mp4!,
    tags: ['archive', 'classic'],
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
    source: { provider: 'giphy', id: gif.id, url: gif.url, author: gif.username || null },
  }
  await db.putMeme(meme)
  await db.putPosition(meme.id, db.ARCHIVE_SUB, 100)
  console.log(`archived: ${title} (${meme.id})`)
}
console.log('giphy seed done')
process.exit(0)
