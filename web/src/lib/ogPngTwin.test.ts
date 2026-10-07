import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ogPngTwin } from './ogPngTwin'

const WEBP_URL = 'https://cdn.test/art.webp?alt=media'
const UPLOAD_URL = 'https://s3.test/put'
const PUBLIC_URL = 'https://assets.test/u.png'

function stubBrowser(putStatus = 200): ReturnType<typeof vi.fn> {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ width: 4, height: 3 })),
  )
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      constructor(
        public width: number,
        public height: number,
      ) {}
      getContext(): { drawImage: () => void } {
        return { drawImage: vi.fn() }
      }
      convertToBlob({ type }: { type: string }): Promise<Blob> {
        return Promise.resolve(new Blob(['png-bytes'], { type }))
      }
    },
  )
  const fetchMock = vi.fn<typeof fetch>((input, init) => {
    const url = String(input)
    if (url === WEBP_URL) {
      return Promise.resolve(new Response(new Blob(['webp'], { type: 'image/webp' })))
    }
    if (url === '/api/uploads') {
      expect(JSON.parse(String(init?.body))).toMatchObject({ contentType: 'image/png' })
      return Promise.resolve(Response.json({ uploadUrl: UPLOAD_URL, publicUrl: PUBLIC_URL }))
    }
    if (url === UPLOAD_URL) {
      expect(init?.method).toBe('PUT')
      return Promise.resolve(new Response(null, { status: putStatus }))
    }
    throw new Error(`Unexpected fetch: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('ogPngTwin', () => {
  // braces matter: a beforeEach return value is a cleanup hook vitest will call
  beforeEach(() => {
    stubBrowser()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('passes non-webp art through with no twin and no network', async () => {
    const fetchMock = stubBrowser()
    await expect(ogPngTwin('https://cdn.test/art.png')).resolves.toBeNull()
    await expect(ogPngTwin('https://cdn.test/art.gif?rid=1')).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders the webp first frame to png and returns the uploaded URL', async () => {
    await expect(ogPngTwin(WEBP_URL)).resolves.toBe(PUBLIC_URL)
  })

  it('returns null when the webp itself cannot be fetched', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 403 }))),
    )
    await expect(ogPngTwin(WEBP_URL)).resolves.toBeNull()
  })

  it('returns null when the png upload is rejected', async () => {
    stubBrowser(413)
    await expect(ogPngTwin(WEBP_URL)).resolves.toBeNull()
  })
})
