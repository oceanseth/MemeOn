import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import {
  discordLinkInFlight,
  linkDiscordAccount,
  shouldAutoLinkDiscord,
} from './discordLink'
import { getDiscordLinkToken, setDiscordLinkConsent, setDiscordLinkToken } from './sessionBus'

function stubStorage(): void {
  const local = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => {
      local.set(key, value)
    },
    removeItem: (key: string) => {
      local.delete(key)
    },
    clear: () => local.clear(),
  })
  const session = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => session.get(key) ?? null,
    setItem: (key: string, value: string) => {
      session.set(key, value)
    },
    removeItem: (key: string) => {
      session.delete(key)
    },
    clear: () => session.clear(),
  })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const result = Response.json(body, init)
  result.text = async () => JSON.stringify(body)
  return result
}

describe('linkDiscordAccount', () => {
  beforeEach(() => {
    stubStorage()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shares one POST for overlapping same-token calls', async () => {
    const pending = deferred<Response>()
    const fetchMock = vi.fn<typeof fetch>(() => pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    const token = 'token-share-1'
    setDiscordLinkToken(token)

    const first = linkDiscordAccount(token)
    const second = linkDiscordAccount(token)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(getDiscordLinkToken()).toBeNull()
    expect(discordLinkInFlight(token)).toBe(true)
    expect(shouldAutoLinkDiscord(token)).toBe(true)

    pending.resolve(jsonResponse({}))
    await expect(first).resolves.toBeUndefined()
    await expect(second).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/discord/link')
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ token })
    expect(discordLinkInFlight(token)).toBe(false)
  })

  it('POSTs independently for different tokens', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({})))
    vi.stubGlobal('fetch', fetchMock)
    await Promise.all([linkDiscordAccount('token-a-1'), linkDiscordAccount('token-b-1')])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const bodies = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)))
    expect(bodies).toEqual([{ token: 'token-a-1' }, { token: 'token-b-1' }])
  })

  it('POSTs again after a settled failure so unreachable retry works', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: 'boom' }, { status: 500 }))
      .mockResolvedValueOnce(jsonResponse({}))
    vi.stubGlobal('fetch', fetchMock)
    const token = 'token-retry-1'
    await expect(linkDiscordAccount(token)).rejects.toBeInstanceOf(ApiError)
    expect(discordLinkInFlight(token)).toBe(false)
    await expect(linkDiscordAccount(token)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('POSTs again after a settled success', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({})))
    vi.stubGlobal('fetch', fetchMock)
    const token = 'token-retry-ok-1'
    await linkDiscordAccount(token)
    await linkDiscordAccount(token)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('auto-links when consent is stashed even if nothing is in flight', () => {
    expect(shouldAutoLinkDiscord('token-consent-1')).toBe(false)
    setDiscordLinkConsent('1')
    expect(shouldAutoLinkDiscord('token-consent-1')).toBe(true)
  })
})
