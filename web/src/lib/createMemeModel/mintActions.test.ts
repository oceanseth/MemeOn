import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateMemeContext, CreateMemeEvent } from '../../stores/createMemeMachine'
import type { CreateMemeActionHost } from './actionHost'
import { onMint } from './mintActions'
import { baseCreateMemeContext as baseCtx } from './testContext'

function stubBrowser(): void {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
  vi.stubGlobal('window', { location: { origin: 'https://memeon.test' } })
}

function mintHost(ctx: CreateMemeContext): CreateMemeActionHost & { events: CreateMemeEvent[] } {
  const events: CreateMemeEvent[] = []
  return {
    events,
    getCtx: () => ctx,
    send: (event) => {
      events.push(event)
    },
    beginBusy: (busy) => {
      events.push({ type: 'SUBMIT', busy })
    },
    settleBusy: (event) => {
      events.push(event)
    },
    pollVideo: async () => {
      throw new Error('pollVideo should not run during mint')
    },
    getOwner: () => ({ active: true }),
  }
}

const MINT_BODY_KEYS = [
  'title',
  'imageUrl',
  'mediaType',
  'videoUrl',
  'remixOf',
  'source',
  'tags',
] as const

async function postedMintBody(ctx: CreateMemeContext): Promise<Record<string, unknown>> {
  let body: Record<string, unknown> | undefined
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input, init) => {
      const url = String(input)
      if (url === '/api/memes') {
        expect(init?.method).toBe('POST')
        body = JSON.parse(String(init?.body)) as Record<string, unknown>
        return Promise.resolve(Response.json({ meme: { id: 'meme-1' } }))
      }
      throw new Error(`Unexpected fetch: ${url}`)
    }),
  )
  await onMint(mintHost(ctx))
  if (!body) throw new Error('POST /api/memes was not called')
  return body
}

describe('onMint', () => {
  beforeEach(() => stubBrowser())
  afterEach(() => vi.unstubAllGlobals())

  it('POSTs /api/memes JSON exactly { title, imageUrl, mediaType, videoUrl, remixOf, source, tags }', async () => {
    const source = { provider: 'giphy', id: 'cat-1', url: 'https://giphy.com/gifs/cat-1', author: 'catlord' }
    const body = await postedMintBody({
      ...baseCtx,
      title: 'burning office',
      tags: 'chaos,  cats, ',
      prompt: 'a capybara',
      artworkSource: source,
    })
    expect(Object.keys(body)).toEqual([...MINT_BODY_KEYS])
    expect(body).toEqual({
      title: 'burning office',
      imageUrl: '/thumb.png',
      mediaType: 'image',
      videoUrl: null,
      remixOf: null,
      source,
      tags: ['chaos', 'cats'],
    })
  })

  it('sends mediaType video and the videoUrl when New video is the mode', async () => {
    const body = await postedMintBody({
      ...baseCtx,
      mode: 'video',
      videoUrl: '/clip.mp4',
      tags: '',
    })
    expect(Object.keys(body)).toEqual([...MINT_BODY_KEYS])
    expect(body.mediaType).toBe('video')
    expect(body.videoUrl).toBe('/clip.mp4')
    expect(body.remixOf).toBeNull()
    expect(body.tags).toEqual([])
  })

  it('sets remixOf from remixId only in remix mode', async () => {
    const remix = await postedMintBody({
      ...baseCtx,
      mode: 'remix',
      remixId: 'source-1',
      videoUrl: '/animated.mp4',
    })
    expect(Object.keys(remix)).toEqual([...MINT_BODY_KEYS])
    expect(remix.mediaType).toBe('video')
    expect(remix.videoUrl).toBe('/animated.mp4')
    expect(remix.remixOf).toBe('source-1')

    const upload = await postedMintBody({
      ...baseCtx,
      mode: 'upload',
      remixId: 'source-1',
      videoUrl: '/clip.mp4',
    })
    expect(upload.remixOf).toBeNull()
    expect(upload.mediaType).toBe('video')
  })
})
