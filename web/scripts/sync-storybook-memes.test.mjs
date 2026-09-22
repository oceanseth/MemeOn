import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { main } from './sync-storybook-memes.mjs'

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
