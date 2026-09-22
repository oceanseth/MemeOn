import assert from 'node:assert/strict'
import test from 'node:test'
import type { Meme } from './types'
import {
  binderPageHtml,
  ensureOgImageWithDependencies,
  giphyGifUrl,
  memeOgKey,
  memeOgMetaBlock,
  profilePageHtml,
  type MemeOgDependencies,
} from './og'
import { testOgFrameManifest as manifest } from './og.fixtures'

const meme: Meme = {
  id: 'meme-1',
  title: 'edge-to-edge <meme>',
  description: null,
  mediaType: 'image',
  imageUrl: 'https://media.example/meme.png',
  videoUrl: null,
  tags: [],
  creatorId: 'creator-1',
  creatorName: 'Creator',
  ownerId: 'owner-1',
  ownerName: 'Owner',
  reshares: 1000,
  tierKey: 'gold',
  listing: null,
  createdAt: '2026-09-22T00:00:00.000Z',
  uniqueRefs: 3,
}

test('meme metadata advertises the portrait collectible dimensions', () => {
  const metadata = memeOgMetaBlock(meme, 'https://assets.example/card.png')
  assert.match(metadata.block, /og:image:width" content="960"/)
  assert.match(metadata.block, /og:image:height" content="1200"/)
  assert.match(metadata.block, /og:image:type" content="image\/png"/)
  assert.doesNotMatch(metadata.block, /content="630"/)
  assert.match(metadata.title, /edge-to-edge <meme>/)
  assert.match(metadata.block, /edge-to-edge &lt;meme&gt;/)
})

test('Giphy looping embeds stay raw GIFs without collectible dimensions', () => {
  const gif = giphyGifUrl('https://media.giphy.com/media/abc/giphy.mp4?rid=giphy.mp4')
  assert.equal(gif, 'https://media.giphy.com/media/abc/giphy.gif?rid=giphy.gif')
  const metadata = memeOgMetaBlock(
    { ...meme, mediaType: 'video', videoUrl: 'https://media.giphy.com/media/abc/giphy.mp4' },
    'https://assets.example/card.png',
    gif,
  )
  assert.match(metadata.block, /og:image:type" content="image\/gif"/)
  assert.doesNotMatch(metadata.block, /og:image:width/)
  assert.doesNotMatch(metadata.block, /og:video/)
})

test('profile and binder metadata keep their wide 1200x630 cards', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response('<!doctype html><html><head><title>MemeOn</title></head><body></body></html>')
  try {
    const profile = await profilePageHtml(
      { sub: 'user-1', name: 'Memelord', coins: 10, collectionSize: 2 },
      'https://assets.example/profile.png',
    )
    const binder = await binderPageHtml(
      { sub: 'user-1', name: 'Memelord' },
      { collectionSize: 2, value: 20 },
      undefined,
      'https://assets.example/binder.png',
    )
    for (const html of [profile, binder]) {
      assert.match(html, /og:image:width" content="1200"/)
      assert.match(html, /og:image:height" content="630"/)
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('immutable cache hits do not fetch or compose and use the new namespace', async () => {
  const calls: string[] = []
  const dependencies: MemeOgDependencies = {
    assetExists: async (key) => {
      calls.push(`exists:${key}`)
      return true
    },
    assetUrl: (key) => `https://assets.example/${key}`,
    putAsset: async () => {
      throw new Error('unexpected put')
    },
    fetchArt: async () => {
      throw new Error('unexpected fetch')
    },
    loadFrame: async () => {
      throw new Error('unexpected frame load')
    },
    compose: async () => {
      throw new Error('unexpected compose')
    },
  }
  const result = await ensureOgImageWithDependencies(meme, dependencies)
  assert.equal(result, `https://assets.example/${memeOgKey(meme.id, 'gold')}`)
  assert.deepEqual(calls, [`exists:${memeOgKey(meme.id, 'gold')}`])
  assert.match(result, /og\/v6-collectible\//)
  assert.doesNotMatch(result, /og\/v5\//)
})

test('cache misses compose the bundled tier over safely fetched source bytes', async () => {
  const events: string[] = []
  const dependencies: MemeOgDependencies = {
    assetExists: async () => false,
    assetUrl: (key) => `https://assets.example/${key}`,
    fetchArt: async (url) => {
      events.push(`fetch:${url}`)
      return Buffer.from('source')
    },
    loadFrame: async (tierKey) => {
      events.push(`frame:${tierKey}`)
      return { frame: Buffer.from('frame'), manifest, tierKey }
    },
    compose: async ({ art, frame, mediaType }) => {
      assert.equal(art.toString(), 'source')
      assert.equal(frame.toString(), 'frame')
      assert.equal(mediaType, 'image')
      events.push('compose')
      return Buffer.from('png')
    },
    putAsset: async (key, body, contentType) => {
      assert.equal(key, memeOgKey(meme.id, 'gold'))
      assert.equal(body.toString(), 'png')
      assert.equal(contentType, 'image/png')
      events.push('put')
      return `https://assets.example/${key}`
    },
  }

  await ensureOgImageWithDependencies(meme, dependencies)
  assert.deepEqual(events.sort(), ['compose', `fetch:${meme.imageUrl}`, 'frame:gold', 'put'])
})
