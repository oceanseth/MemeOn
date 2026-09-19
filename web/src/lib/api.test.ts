import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, setMaskyAccessToken, setSessionToken } from './api'

function stubStorage(): void {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
}

function stubFetch(): ReturnType<typeof vi.fn<typeof fetch>> {
  const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(Response.json({})))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function lastInit(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>): RequestInit | undefined {
  return fetchMock.mock.calls.at(-1)?.[1]
}

function outgoingHeaders(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>): Headers {
  return new Headers(lastInit(fetchMock)?.headers)
}

function expectNoNumericHeaderKeys(headers: Headers): void {
  expect(headers.has('0')).toBe(false)
  expect(headers.has('1')).toBe(false)
}

describe('apiFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>

  beforeEach(() => {
    stubStorage()
    fetchMock = stubFetch()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('forwards a Headers instance custom header without numeric keys', async () => {
    await apiFetch('/api/me', { headers: new Headers({ 'X-Foo': 'bar' }) })
    const headers = outgoingHeaders(fetchMock)
    expect(headers.get('X-Foo')).toBe('bar')
    expectNoNumericHeaderKeys(headers)
  })

  it('forwards a plain Record custom header', async () => {
    await apiFetch('/api/me', { headers: { 'X-Foo': 'bar' } })
    expect(outgoingHeaders(fetchMock).get('X-Foo')).toBe('bar')
  })

  it('forwards a string[][] custom header without numeric keys', async () => {
    await apiFetch('/api/me', { headers: [['X-Foo', 'bar']] })
    const headers = outgoingHeaders(fetchMock)
    expect(headers.get('X-Foo')).toBe('bar')
    expectNoNumericHeaderKeys(headers)
  })

  it('defaults content-type to application/json when omitted', async () => {
    await apiFetch('/api/me')
    expect(outgoingHeaders(fetchMock).get('content-type')).toBe('application/json')
  })

  it('lets a caller content-type override the default', async () => {
    await apiFetch('/api/me', { headers: { 'content-type': 'text/plain' } })
    expect(outgoingHeaders(fetchMock).get('content-type')).toBe('text/plain')
  })

  it('sets authorization from the session token and replaces a caller Authorization', async () => {
    setSessionToken('sess-1')
    await apiFetch('/api/me', { headers: { Authorization: 'Bearer caller' } })
    expect(outgoingHeaders(fetchMock).get('authorization')).toBe('Bearer sess-1')
  })

  it('sets x-masky-token from the Masky access token', async () => {
    setMaskyAccessToken('masky-1')
    await apiFetch('/api/me')
    expect(outgoingHeaders(fetchMock).get('x-masky-token')).toBe('masky-1')
  })

  it('omits authorization and x-masky-token when no tokens are stored', async () => {
    await apiFetch('/api/me')
    const headers = outgoingHeaders(fetchMock)
    expect(headers.has('authorization')).toBe(false)
    expect(headers.has('x-masky-token')).toBe(false)
  })

  it('forwards init.signal', async () => {
    const signal = AbortSignal.abort()
    await apiFetch('/api/me', { signal })
    expect(lastInit(fetchMock)?.signal).toBe(signal)
  })
})
