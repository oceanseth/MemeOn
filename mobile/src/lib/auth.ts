import * as WebBrowser from 'expo-web-browser'
import { apiFetch, post, storeTokens } from './api'
import { API_BASE } from './config'
import type { Me } from './types'

// Masky only allows https redirect URIs, so we bounce through the site's
// /auth/mobile page, which forwards code+state to the memeon:// deep link.
const REDIRECT_URI = `${API_BASE}/auth/mobile`
const DEEP_LINK = 'memeon://auth'

function randomState(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('')
}

export async function loginWithMasky(): Promise<Pick<Me, 'sub' | 'name' | 'picture' | 'coins'>> {
  const cfg = await apiFetch<{ authorizeUrl: string; clientId: string; scopes: string }>(
    '/api/auth/masky/config',
  )
  const state = randomState()
  const url = new URL(cfg.authorizeUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', cfg.clientId)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('scope', cfg.scopes)
  url.searchParams.set('state', state)

  const result = await WebBrowser.openAuthSessionAsync(url.toString(), DEEP_LINK)
  if (result.type !== 'success' || !result.url) throw new Error('login cancelled')

  const returned = new URL(result.url)
  const code = returned.searchParams.get('code')
  const gotState = returned.searchParams.get('state')
  if (!code) throw new Error(returned.searchParams.get('error') ?? 'no authorization code')
  if (gotState !== state) throw new Error('OAuth state mismatch — try again')

  const res = await post<{
    sessionToken: string
    maskyAccessToken: string
    profile: Pick<Me, 'sub' | 'name' | 'picture' | 'coins'>
  }>('/api/auth/masky/callback', { code, redirectUri: REDIRECT_URI })

  await storeTokens(res.sessionToken, res.maskyAccessToken)
  return res.profile
}
