import { apiFetch, post, setMaskyAccessToken, setSessionToken } from './api'
import { firebaseSignIn } from './firebase'
import type { Me } from './types'

const STATE_KEY = 'masky_oauth_state'
const REDIRECT_PATH = '/auth/callback'

const redirectUri = (): string => `${window.location.origin}${REDIRECT_PATH}`

/** Kick off Masky OAuth: fetch public config, then bounce to Masky's authorize page. */
export async function beginMaskyLogin(): Promise<void> {
  const cfg = await apiFetch<{ authorizeUrl: string; clientId: string; scopes: string }>(
    '/api/auth/masky/config',
  )
  const state = crypto.randomUUID()
  sessionStorage.setItem(STATE_KEY, state)
  const url = new URL(cfg.authorizeUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', cfg.clientId)
  url.searchParams.set('redirect_uri', redirectUri())
  url.searchParams.set('scope', cfg.scopes)
  url.searchParams.set('state', state)
  window.location.assign(url.toString())
}

/**
 * Complete the OAuth round-trip: validate state, exchange the code via our API
 * for a session JWT + the Masky access token (used to spend the user's credits).
 */
export async function completeMaskyLogin(
  code: string,
  state: string | null,
): Promise<Pick<Me, 'sub' | 'name' | 'picture' | 'coins'>> {
  const expected = sessionStorage.getItem(STATE_KEY)
  sessionStorage.removeItem(STATE_KEY)
  if (!expected || expected !== state) throw new Error('OAuth state mismatch — try again')

  const res = await post<{
    sessionToken: string
    maskyAccessToken: string
    firebaseToken: string | null
    profile: Pick<Me, 'sub' | 'name' | 'picture' | 'coins'>
  }>('/api/auth/masky/callback', { code, redirectUri: redirectUri() })

  setSessionToken(res.sessionToken)
  setMaskyAccessToken(res.maskyAccessToken)
  // join the Firebase project too (RTDB presence); non-fatal if it fails
  if (res.firebaseToken) await firebaseSignIn(res.firebaseToken).catch(() => {})
  return res.profile
}
