import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubLocalStorage } from '../test/runtime'
import { ApiError } from './api'
import { DISCORD_LINK_TIMEOUT_MS, hasDiscordLinkInFlight, postDiscordLink } from './discordLink'

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
    stubLocalStorage()
    fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('drops the lock when a hung POST times out so a later call POSTs again', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation((_input, init) => {
      const signal = init?.signal
      return new Promise<Response>((_resolve, reject) => {
        if (signal == null) return
        const fail = () => {
          reject(signal.reason)
        }
        if (signal.aborted) {
          fail()
          return
        }
        signal.addEventListener('abort', fail)
      })
    })

    const first = postDiscordLink('token-hang')
    const second = postDiscordLink('token-hang')
    const aborted = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    expect(first).toBe(second)
    expect(hasDiscordLinkInFlight('token-hang')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(1)
    const signal = fetchMock.mock.calls[0]?.[1]?.signal
    expect(signal?.aborted).toBe(false)
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      token: 'token-hang',
    })

    await vi.advanceTimersByTimeAsync(DISCORD_LINK_TIMEOUT_MS - 1)
    expect(hasDiscordLinkInFlight('token-hang')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(1)
    expect(signal?.aborted).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    const error = await first.catch((reason: unknown) => reason)
    await aborted
    expect(error).not.toBeInstanceOf(ApiError)
    expect(hasDiscordLinkInFlight('token-hang')).toBe(false)
    expect(vi.getTimerCount()).toBe(0)

    fetchMock.mockImplementation(() => Promise.resolve(Response.json({})))
    await expect(postDiscordLink('token-hang')).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })
})
