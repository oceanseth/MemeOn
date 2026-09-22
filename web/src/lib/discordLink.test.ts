import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import { hasDiscordLinkInFlight, postDiscordLink } from './discordLink'

function stubStorage(): void {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
  })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

describe('postDiscordLink', () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>

  beforeEach(() => {
    stubStorage()
    fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shares one POST for overlapping calls with the same token', async () => {
    const pending = deferred<Response>()
    fetchMock.mockImplementation(() => pending.promise)

    const first = postDiscordLink('token-a')
    const second = postDiscordLink('token-a')
    expect(first).toBe(second)
    expect(hasDiscordLinkInFlight('token-a')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      token: 'token-a',
    })

    pending.resolve(Response.json({}))
    await expect(first).resolves.toBeUndefined()
    await expect(second).resolves.toBeUndefined()
    expect(hasDiscordLinkInFlight('token-a')).toBe(false)
  })

  it('POSTs again after an unreachable attempt settles', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ error: 'boom' }, { status: 500 }))
      .mockResolvedValueOnce(Response.json({}))

    await expect(postDiscordLink('token-b')).rejects.toBeInstanceOf(ApiError)
    expect(hasDiscordLinkInFlight('token-b')).toBe(false)

    await expect(postDiscordLink('token-b')).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls.map((call) => JSON.parse(String(call[1]?.body)))).toEqual([
      { token: 'token-b' },
      { token: 'token-b' },
    ])
  })

  it('does not share in-flight work across different tokens', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({})))
    await Promise.all([postDiscordLink('token-c'), postDiscordLink('token-d')])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
