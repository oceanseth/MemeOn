import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ROLE_PICKERS, main, pickRole } from './sync-storybook-memes.mjs'

const MEMES_URL = 'https://dev.memeon.ai/api/memes?limit=120'
const FRAMES_URL = 'https://dev.memeon.ai/api/frames'

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const sampleMemes = () => {
  const image = (tierKey, extra = {}) => ({
    id: tierKey,
    title: tierKey,
    imageUrl: `https://cdn.example/meme-${tierKey}.png`,
    reshares: 1,
    tierKey,
    mediaType: 'image',
    ...extra,
  })
  return [
    image('paper'),
    image('silver', { title: 'pushrax', listing: { shares: 1 } }),
    image('holo'),
    image('chrome'),
    image('gold'),
    image('shiny'),
    {
      id: 'video',
      title: 'clip',
      imageUrl: 'https://cdn.example/meme-video.png',
      videoUrl: 'https://cdn.example/v.mp4',
      reshares: 1,
      mediaType: 'video',
    },
  ]
}

const run = (framesStatus, framesBody) => {
  const writes = []
  const calls = []
  const outPath = join(
    tmpdir(),
    `sync-storybook-memes-${Date.now()}-${Math.random().toString(16).slice(2)}.ts`,
  )
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    if (url === MEMES_URL) return jsonResponse(200, { memes: sampleMemes() })
    if (url === FRAMES_URL) return jsonResponse(framesStatus, framesBody)
    throw new Error(`unexpected url ${url}`)
  }
  const writeFileSync = (target, text) => {
    assert.equal(String(target).includes('dev-meme-media.ts'), false)
    writes.push({ target, text })
  }
  const pending = main({
    fetchImpl,
    token: 'test-token',
    writeFileSync,
    outPath,
  })
  return { writes, calls, outPath, pending }
}

const assertFetch = (calls) => {
  const memesCall = calls.find((call) => call.url === MEMES_URL)
  const framesCall = calls.find((call) => call.url === FRAMES_URL)
  assert.ok(memesCall)
  assert.equal(memesCall.init?.headers?.Authorization, 'Bearer test-token')
  assert.ok(framesCall)
  assert.equal(framesCall.init?.headers?.Authorization, undefined)
}

test('rejects a 502 frames response before writing', async () => {
  const { writes, calls, pending } = run(502, {})
  await assert.rejects(pending, { message: 'frames fetch failed (502)' })
  assert.equal(writes.length, 0)
  assertFetch(calls)
})

test('rejects a 503 frames error before writing', async () => {
  const { writes, calls, pending } = run(503, { error: 'frames down' })
  await assert.rejects(pending, { message: 'frames down' })
  assert.equal(writes.length, 0)
  assertFetch(calls)
})

test('rejects a 200 frames body that carries an error before writing', async () => {
  const { writes, calls, pending } = run(200, { error: 'partial' })
  await assert.rejects(pending, { message: 'partial' })
  assert.equal(writes.length, 0)
  assertFetch(calls)
})

test('writes frame key/url pairs from a 200 frames array', async () => {
  const frames = [
    { key: 'paper', url: 'https://cdn.example/paper.png' },
    { key: 'gold', url: 'https://cdn.example/gold.png' },
  ]
  const { writes, calls, outPath, pending } = run(200, { frames })
  await pending
  assertFetch(calls)
  assert.equal(writes.length, 1)
  assert.equal(writes[0].target, outPath)
  assert.match(writes[0].text, /export const devMemeMedia/)
  assert.match(writes[0].text, /"paper": "https:\/\/cdn\.example\/paper\.png"/)
  assert.match(writes[0].text, /"gold": "https:\/\/cdn\.example\/gold\.png"/)
})

test('writes an empty frames object when the 200 frames array is empty', async () => {
  const { writes, calls, outPath, pending } = run(200, { frames: [] })
  await pending
  assertFetch(calls)
  assert.equal(writes.length, 1)
  assert.equal(writes[0].target, outPath)
  assert.match(writes[0].text, /"frames": \{\}/)
})

const video = (over = {}) => ({
  mediaType: 'video',
  videoUrl: 'https://example/x.mp4',
  reshares: 1,
  ...over,
})

test('ROLE_PICKERS.video does not require imageUrl, and pickRole does not throw', () => {
  for (const imageUrl of [undefined, null, 1]) {
    const meme = video(imageUrl === undefined ? {} : { imageUrl })
    assert.ok(ROLE_PICKERS.video(meme))
    assert.equal(pickRole([meme], ROLE_PICKERS.video), meme)
  }
})

test('a non-string imageUrl is skipped so a non-placecats string still wins', () => {
  const posterless = video({ reshares: 50 })
  const real = video({ reshares: 2, imageUrl: 'https://cdn.example/b.jpg' })
  assert.equal(pickRole([real, posterless], ROLE_PICKERS.video), real)
})

test('string imageUrls prefer one that does not include placecats.com', () => {
  const placecats = video({ reshares: 10, imageUrl: 'https://placecats.com/a.jpg' })
  const nested = video({
    reshares: 9,
    imageUrl: 'https://cdn.example/nested/placecats.com/c.jpg',
  })
  const real = video({ reshares: 1, imageUrl: 'https://cdn.example/b.jpg' })
  const empty = video({ reshares: 3, imageUrl: '' })
  const cleanHigh = video({ reshares: 6, imageUrl: 'https://cdn.example/high.jpg' })
  const cleanLow = video({ reshares: 2, imageUrl: 'https://cdn.example/low.jpg' })
  assert.equal(pickRole([placecats, nested, real], ROLE_PICKERS.video), real)
  assert.equal(pickRole([placecats, empty], ROLE_PICKERS.video), empty)
  assert.equal(pickRole([cleanLow, cleanHigh], ROLE_PICKERS.video), cleanHigh)
})

test('when every string imageUrl is a placecat, fallback is matches[0]', () => {
  const low = video({ reshares: 1, imageUrl: 'https://placecats.com/low.jpg' })
  const high = video({ reshares: 8, imageUrl: 'https://placecats.com/high.jpg' })
  const posterless = video({ reshares: 4, imageUrl: null })
  assert.equal(pickRole([low, posterless, high], ROLE_PICKERS.video), high)
})

test('when no imageUrl is a string, fallback is matches[0]', () => {
  const low = video({ reshares: 1, imageUrl: null })
  const high = video({ reshares: 4 })
  assert.equal(pickRole([low, high], ROLE_PICKERS.video), high)
})

test('no video match is null', () => {
  assert.equal(pickRole([], ROLE_PICKERS.video), null)
  assert.equal(
    pickRole(
      [{ mediaType: 'image', imageUrl: 'https://cdn.example/a.jpg', reshares: 1 }],
      ROLE_PICKERS.video,
    ),
    null,
  )
})
