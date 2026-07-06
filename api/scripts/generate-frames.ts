// One-shot: generate the 7 virality tier card frames with the Masky image API
// and upload them to the assets buckets (prod + dev) as frames/{tier}.png.
// Uses a first-party mky_ key from SSM. Frames are 900x1200 PNG with an open
// center window that og.ts composites meme art into.
//
// Usage: AWS_REGION=us-west-2 npx tsx scripts/generate-frames.ts [tierKey ...]
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Jimp } from 'jimp'
import { TIERS } from '../../shared/tiers'
import { framePrompt } from '../src/routes'

const KEY_PARAM = process.env.MASKY_KEY_PARAM ?? '/chooseastory/production/masky_api_key'
const BUCKETS = (process.env.FRAME_BUCKETS ?? 'memeon-assets-production,memeon-assets-dev').split(',')

const s3 = new S3Client({})

let maskyKey = process.env.MASKY_API_KEY
if (!maskyKey) {
  const ssm = new SSMClient({ region: process.env.MASKY_KEY_REGION ?? 'us-east-1' })
  const keyRes = await ssm.send(new GetParameterCommand({ Name: KEY_PARAM, WithDecryption: true }))
  maskyKey = keyRes.Parameter?.Value
}
if (!maskyKey) throw new Error(`no masky key at ${KEY_PARAM}`)

const only = process.argv.slice(2)
const targets = only.length ? TIERS.filter((t) => only.includes(t.key)) : TIERS

for (const [idx, tier] of TIERS.entries()) {
  if (!targets.includes(tier)) continue
  const prompt = framePrompt(tier.name, idx)
  console.log(`\n=== ${tier.key} (${tier.name}) ===`)
  const res = await fetch('https://masky.ai/api/images/generate', {
    method: 'POST',
    headers: { authorization: `Bearer ${maskyKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ prompt, aspectRatio: '3:4' }),
  })
  const data = (await res.json()) as { imageUrl?: string; creditCost?: number }
  if (!res.ok || !data.imageUrl) throw new Error(`generate failed: ${JSON.stringify(data)}`)
  console.log(`generated (${data.creditCost} credits): ${data.imageUrl}`)

  const imgRes = await fetch(data.imageUrl)
  const img = await Jimp.read(Buffer.from(await imgRes.arrayBuffer()))
  img.cover({ w: 900, h: 1200 })
  const png = await img.getBuffer('image/png')

  for (const bucket of BUCKETS) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket.trim(),
        Key: `frames/${tier.key}.png`,
        Body: png,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=86400',
      }),
    )
    console.log(`uploaded s3://${bucket.trim()}/frames/${tier.key}.png`)
  }
}
console.log('\nAll frames done.')
