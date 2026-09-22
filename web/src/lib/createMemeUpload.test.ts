import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemeCopy } from '../copy/createMeme'
import { mintDeskError } from './createMemeMintError'
import { UPLOAD_TIMEOUT_MS, uploadCreateMemeFile } from './createMemeUpload'

const copy = createMemeCopy

function isUploadRejectedMessage(message: string): boolean {
  const status = message.match(/\((\d+)\)/)?.[1]
  return status !== undefined && message === copy.errors.uploadRejected(Number(status))
}

function stubStorage(): void {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
}

describe('uploadCreateMemeFile', () => {
  beforeEach(() => {
    stubStorage()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

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
    expect(vi.getTimerCount()).toBe(0)
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
    expect(vi.getTimerCount()).toBe(0)
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
    expect(vi.getTimerCount()).toBe(0)
  })

  it('aborts a stalled storage PUT after UPLOAD_TIMEOUT_MS', async () => {
    const file = new File(['pixels'], 'cat.png', { type: 'image/png' })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((input, init) => {
        const url = String(input)
        if (url === '/api/uploads') {
          expect(init?.signal).toBeUndefined()
          return Promise.resolve(
            Response.json({
              uploadUrl: 'https://storage.example/put',
              publicUrl: '/public/cat.png',
            }),
          )
        }
        if (url === 'https://storage.example/put') {
          const signal = init?.signal
          if (!signal) throw new Error('storage PUT is missing an AbortSignal')
          return new Promise((_resolve, reject) => {
            const abort = () => {
              reject(signal.reason)
            }
            if (signal.aborted) abort()
            else signal.addEventListener('abort', abort, { once: true })
          })
        }
        throw new Error(`Unexpected fetch: ${url}`)
      }),
    )

    let settled = false
    const pending = uploadCreateMemeFile(file).then(
      (value) => {
        settled = true
        return value
      },
      (error: unknown) => {
        settled = true
        throw error
      },
    )

    await vi.advanceTimersByTimeAsync(UPLOAD_TIMEOUT_MS - 1)
    expect(settled).toBe(false)
    expect(vi.getTimerCount()).toBe(1)

    const rejected = pending.then(
      () => {
        throw new Error('expected the stalled PUT to reject')
      },
      (error: unknown) => error,
    )
    await vi.advanceTimersByTimeAsync(1)
    const error = await rejected

    expect(error).toMatchObject({ name: 'AbortError' })
    const message = error instanceof Error ? error.message : String(error)
    expect(message).not.toBe(copy.errors.uploadFailed)
    expect(isUploadRejectedMessage(message)).toBe(false)
    expect(mintDeskError(error, copy.errors.uploadFailed)).toBe(copy.errors.uploadFailed)
    expect(mintDeskError(error, copy.errors.uploadFailed)).not.toBe(copy.errors.uploadRejected(0))
    expect(vi.getTimerCount()).toBe(0)
  })
})
