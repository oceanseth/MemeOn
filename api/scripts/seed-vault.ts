// Seed the MemeOn Vault: the house account whose memes fill starter packs.
// Generates card art with the first-party Masky key and mints each meme with
// the vault holding all 100 shares (packs hand out 10 at a time).
//
// Usage: TABLE_NAME=memeon-dev SSM_PREFIX=/memeon/dev AWS_REGION=us-west-2 \
//          npx tsx scripts/seed-vault.ts
import { randomUUID } from 'node:crypto'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import * as db from '../src/db'
import { TIERS } from '../../shared/tiers'
import type { Meme } from '../src/types'

const STARTERS: { title: string; tags: string[]; prompt: string }[] = [
  {
    title: 'Doomscroll Hamster',
    tags: ['starter', 'animals'],
    prompt:
      'a wide-eyed hamster in bed at 3am illuminated by phone glow, doomscrolling, hyper detailed, funny meme style',
  },
  {
    title: 'Business Pigeon',
    tags: ['starter', 'hustle'],
    prompt:
      'a pigeon in a tiny business suit giving a powerpoint presentation to other pigeons on a rooftop, corporate memo energy',
  },
  {
    title: 'Existential Toaster',
    tags: ['starter', 'chaos'],
    prompt:
      'a retro toaster with googly eyes staring into the distance while toast burns, existential dread, kitchen drama, meme style',
  },
  {
    title: 'Gym Axolotl',
    tags: ['starter', 'fitness'],
    prompt:
      'a pink axolotl lifting comically tiny dumbbells at the gym, sweatband, determined face, motivational poster style',
  },
  {
    title: 'Cat.exe Has Stopped',
    tags: ['starter', 'cats'],
    prompt:
      'a cat frozen mid-zoomies in a glitchy blue-screen error pose, digital artifacts, windows error aesthetic, funny',
  },
  {
    title: 'Procrastination Sloth',
    tags: ['starter', 'mood'],
    prompt:
      'a sloth at a desk surrounded by sticky notes saying tomorrow, sipping coffee in slow motion, cozy office, meme style',
  },
]

const KEY_PARAM = process.env.MASKY_KEY_PARAM ?? '/chooseastory/production/masky_api_key'
const ssm = new SSMClient({ region: process.env.MASKY_KEY_REGION ?? 'us-east-1' })
const keyRes = await ssm.send(new GetParameterCommand({ Name: KEY_PARAM, WithDecryption: true }))
const maskyKey = keyRes.Parameter!.Value!

// house profile (idempotent)
await db.ensureUser({ sub: db.VAULT_SUB, name: 'MemeOn Vault', picture: null })

const existing = await db.listMemes()
for (const s of STARTERS) {
  if (existing.some((m) => m.creatorId === db.VAULT_SUB && m.title === s.title)) {
    console.log(`skip (exists): ${s.title}`)
    continue
  }
  const res = await fetch('https://masky.ai/api/images/generate', {
    method: 'POST',
    headers: { authorization: `Bearer ${maskyKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: s.prompt, aspectRatio: '1:1' }),
  })
  const data = (await res.json()) as { imageUrl?: string }
  if (!res.ok || !data.imageUrl) throw new Error(`generate failed for ${s.title}`)
  const meme: Meme = {
    id: randomUUID().slice(0, 12),
    title: s.title,
    description: 'A MemeOn Vault starter card.',
    mediaType: 'image',
    imageUrl: data.imageUrl,
    videoUrl: null,
    tags: s.tags,
    creatorId: db.VAULT_SUB,
    creatorName: 'MemeOn Vault',
    ownerId: db.VAULT_SUB,
    ownerName: 'MemeOn Vault',
    reshares: 0,
    tierKey: TIERS[0].key,
    listing: null,
    createdAt: new Date().toISOString(),
    remixOf: null,
    private: false,
  }
  await db.putMeme(meme)
  await db.putPosition(meme.id, db.VAULT_SUB, 100)
  console.log(`minted: ${s.title} (${meme.id})`)
}
console.log('vault seeded')
process.exit(0)
