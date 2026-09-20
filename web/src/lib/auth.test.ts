import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { maskyAccessToken, sessionToken } from './api'
import { completeMaskyLogin } from './auth'
import { firebaseSignIn } from './firebase'
import { setMaskyOauthState } from './sessionBus'

const { firebaseSignIn: firebaseSignInMock } = vi.hoisted(() => ({
  firebaseSignIn: vi.fn(),
}))

vi.mock('./firebase', () => ({ firebaseSignIn: firebaseSignInMock }))

const profile = { sub: 'u1', name: 'Ada', picture: null, coins: 3 }

function stubBrowser() {
  const local = new Map<string, string>()
  const session = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => {
      local.set(key, value)
    },
    removeItem: (key: string) => {
      local.delete(key)
    },
  })
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => session.get(key) ?? null,
    setItem: (key: string, value: string) => {
      session.set(key, value)
    },
    removeItem: (key: string) => {
      session.delete(key)
    },
  })
  vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } })
  return { session }
}

describe('completeMaskyLogin', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    firebaseSignInMock.mockReset()
    const { session } = stubBrowser()
    session.set('masky_oauth_state', 'state-1')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns the profile and keeps tokens when firebaseSignIn rejects', async () => {
    const err = new Error('auth disabled')
    firebaseSignInMock.mockRejectedValue(err)
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          Response.json({
            sessionToken: 'sess',
            maskyAccessToken: 'masky',
            firebaseToken: 'fb-token',
            profile,
          }),
        ),
      ),
    )

    await expect(completeMaskyLogin('code', 'state-1')).resolves.toEqual(profile)
    expect(sessionToken()).toBe('sess')
    expect(maskyAccessToken()).toBe('masky')
    expect(firebaseSignIn).toHaveBeenCalledWith('fb-token')
    expect(console.error).toHaveBeenCalledWith('[memeon firebase] sign-in failed', err)
  })

  it('skips sign-in without logging when firebaseToken is null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(
          Response.json({
            sessionToken: 'sess',
            maskyAccessToken: 'masky',
            firebaseToken: null,
            profile,
          }),
        ),
      ),
    )

    await expect(completeMaskyLogin('code', 'state-1')).resolves.toEqual(profile)
    expect(sessionToken()).toBe('sess')
    expect(maskyAccessToken()).toBe('masky')
    expect(firebaseSignIn).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('issues one POST /api/auth/masky/callback for overlapping same-code calls', async () => {
    const code = `overlap-${crypto.randomUUID()}`
    const state = `state-${crypto.randomUUID()}`
    setMaskyOauthState(state)
    let resolveFetch!: (value: Response) => void
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const first = completeMaskyLogin(code, state)
    const second = completeMaskyLogin(code, state)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/masky/callback')
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      code,
      redirectUri: 'http://localhost:5173/auth/callback',
    })

    resolveFetch(
      Response.json({
        sessionToken: 'sess-overlap',
        maskyAccessToken: 'masky-overlap',
        firebaseToken: null,
        profile,
      }),
    )
    await expect(first).resolves.toEqual(profile)
    await expect(second).resolves.toEqual(profile)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sessionToken()).toBe('sess-overlap')
    expect(maskyAccessToken()).toBe('masky-overlap')
  })
})
