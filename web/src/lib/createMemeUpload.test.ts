import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemeCopy } from '../copy/createMeme'
import { uploadCreateMemeFile } from './createMemeUpload'

const copy = createMemeCopy

function stubStorage(): void {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
}

describe('uploadCreateMemeFile', () => {
  beforeEach(() => stubStorage())
  afterEach(() => vi.unstubAllGlobals())

  it('requests a signed URL then PUTs the blob and returns the public URL', async () => {
    const file = new File(['pixels'], 'cat.png', { type: 'image/png' })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((input, init) => {
        const url = String(input)
        if (url === '/api/uploads') {
          expect(init?.method).toBe('POST')
          return Promise.resolve(
            Response.json({
              uploadUrl: 'https://storage.example/put',
              publicUrl: '/public/cat.png',
            }),
          )
        }
        if (url === 'https://storage.example/put') {
          expect(init?.method).toBe('PUT')
          expect(init?.headers).toMatchObject({ 'content-type': 'image/png' })
          return Promise.resolve(new Response(null, { status: 200 }))
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    await expect(uploadCreateMemeFile(file)).resolves.toBe('/public/cat.png')
  })

  it('honours an explicit content type for derived blobs', async () => {
    const poster = new Blob(['frame'], { type: 'image/jpeg' })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((input, init) => {
        const url = String(input)
        if (url === '/api/uploads')
          return Promise.resolve(
            Response.json({
              uploadUrl: 'https://storage.example/put',
              publicUrl: '/public/poster.png',
            }),
          )
        if (url === 'https://storage.example/put') {
          expect(init?.headers).toMatchObject({ 'content-type': 'image/png' })
          return Promise.resolve(new Response(null, { status: 200 }))
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    await expect(uploadCreateMemeFile(poster, 'image/png')).resolves.toBe('/public/poster.png')
  })

  it('throws copy.errors.uploadRejected when the storage PUT fails', async () => {
    const file = new File(['pixels'], 'cat.png', { type: 'image/png' })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((input) => {
        const url = String(input)
        if (url === '/api/uploads') {
          return Promise.resolve(
            Response.json({
              uploadUrl: 'https://storage.example/put',
              publicUrl: '/public/cat.png',
            }),
          )
        }
        if (url === 'https://storage.example/put') {
          return Promise.resolve(new Response(null, { status: 403 }))
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    await expect(uploadCreateMemeFile(file)).rejects.toThrow(copy.errors.uploadRejected(403))
  })
})
