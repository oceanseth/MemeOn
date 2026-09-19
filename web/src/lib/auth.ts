import { apiFetch, post, setMaskyAccessToken, setSessionToken } from './api'
import { firebaseSignIn } from './firebase'
import { clearMaskyOauthState, getMaskyOauthState, setMaskyOauthState } from './sessionBus'
import type { Me } from './types'
import { navigateToAuthorization } from './authNavigation'

const REDIRECT_PATH = '/auth/callback'

const redirectUri = (): string => `${window.location.origin}${REDIRECT_PATH}`

/** Kick off Masky OAuth: fetch public config, then bounce to Masky's authorize page. */
export async function beginMaskyLogin(): Promise<void> {
  const cfg = await apiFetch<{ authorizeUrl: string; clientId: string; scopes: string }>(
    '/api/auth/masky/config',
  )
  const state = crypto.randomUUID()
  setMaskyOauthState(state)
  const url = new URL(cfg.authorizeUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', cfg.clientId)
  url.searchParams.set('redirect_uri', redirectUri())
  url.searchParams.set('scope', cfg.scopes)
  url.searchParams.set('state', state)
  navigateToAuthorization(url.toString())
}

type MaskyProfile = Pick<Me, 'sub' | 'name' | 'picture' | 'coins'>

/** Overlapping same-code exchanges share one POST; Masky codes are single-use and post() cannot abort. */
const inFlightByCode = new Map<string, Promise<MaskyProfile>>()

/**
 * Complete the OAuth round-trip: validate state, exchange the code via our API
 * for a session JWT + the Masky access token (used to spend the user's credits).
 */
export function completeMaskyLogin(code: string, state: string | null): Promise<MaskyProfile> {
  const existing = inFlightByCode.get(code)
  if (existing) return existing

  const pending = exchangeMaskyCode(code, state).finally(() => {
    if (inFlightByCode.get(code) === pending) inFlightByCode.delete(code)
  })
  inFlightByCode.set(code, pending)
  return pending
}

async function exchangeMaskyCode(code: string, state: string | null): Promise<MaskyProfile> {
  const expected = getMaskyOauthState()
  clearMaskyOauthState()
  if (!expected || expected !== state) throw new Error('OAuth state mismatch — try again')

  const res = await post<{
    sessionToken: string
    maskyAccessToken: string
    firebaseToken: string | null
    profile: MaskyProfile
  }>('/api/auth/masky/callback', { code, redirectUri: redirectUri() })

  setSessionToken(res.sessionToken)
  setMaskyAccessToken(res.maskyAccessToken)
  // join the Firebase project too (RTDB presence); non-fatal if it fails.
  // null firebaseToken: API mint skipped — skip sign-in, no log.
  if (res.firebaseToken) {
    await firebaseSignIn(res.firebaseToken).catch((err) => {
      console.error('[memeon firebase] sign-in failed', err)
    })
  }
  return res.profile
}
