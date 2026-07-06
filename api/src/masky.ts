// Masky OAuth (SSO) + aigen REST wrappers (https://masky.ai/skill.md).
// Aigen calls take the *user's* OAuth access token so generation bills their credits.
import { getMaskyOAuth } from './ssm'

const BASE = 'https://masky.ai/api'

export interface MaskyProfile {
  /** stable pseudonymous user id (`sub` from userinfo) */
  id: string
  name: string | null
  picture: string | null
  avatarId: string | null
}

export interface MaskyTokenSet {
  accessToken: string
  refreshToken: string | null
  avatar: { id?: string; name?: string | null; picture?: string | null } | null
  raw: Record<string, unknown>
}

/** Exchange an OAuth authorization code for a Masky access token. */
export async function exchangeCode(code: string, redirectUri: string): Promise<MaskyTokenSet> {
  const cfg = await getMaskyOAuth()
  const res = await fetch(cfg.token_url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: cfg.client_id,
      client_secret: cfg.client_secret,
    }),
  })
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(`masky token exchange failed (${res.status}): ${JSON.stringify(raw)}`)
  }
  const accessToken = (raw.access_token ?? raw.accessToken) as string | undefined
  if (!accessToken) throw new Error('masky token response missing access_token')
  return {
    accessToken,
    refreshToken: (raw.refresh_token ?? raw.refreshToken ?? null) as string | null,
    avatar: (raw.avatar ?? null) as MaskyTokenSet['avatar'],
    raw,
  }
}

/** Fetch the Masky user's profile with their access token. Field names normalized defensively. */
export async function fetchProfile(accessToken: string): Promise<MaskyProfile> {
  const cfg = await getMaskyOAuth()
  const res = await fetch(cfg.userinfo_url, {
    headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
  })
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(`masky userinfo failed (${res.status}): ${JSON.stringify(raw)}`)
  }
  const id = (raw.sub ?? raw.id ?? raw.uid ?? raw.userId ?? raw.user_id) as string | undefined
  if (!id) throw new Error('masky userinfo missing user id')
  return {
    id: String(id),
    name: (raw.name ?? raw.displayName ?? raw.display_name ?? null) as string | null,
    picture: (raw.picture ?? raw.photoURL ?? raw.photo ?? raw.avatarUrl ?? null) as string | null,
    avatarId: (raw.avatar_id ?? raw.avatarId ?? null) as string | null,
  }
}

export async function publicConfig(): Promise<{
  authorizeUrl: string
  clientId: string
  scopes: string
}> {
  const cfg = await getMaskyOAuth()
  return { authorizeUrl: cfg.authorize_url, clientId: cfg.client_id, scopes: cfg.scopes }
}

async function maskyFetch<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    const err = new Error(`masky ${path} -> ${res.status}: ${text.slice(0, 300)}`) as Error & {
      status?: number
    }
    err.status = res.status
    throw err
  }
  return data as T
}

export function generateImage(
  token: string,
  prompt: string,
  aspectRatio = '1:1',
): Promise<{ imageUrl: string; aspectRatio: string; creditCost: number }> {
  return maskyFetch(token, '/images/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt, aspectRatio }),
  })
}

/** Image-to-image edit: prompt + up to 5 reference image URLs -> a new image. */
export function editImage(
  token: string,
  prompt: string,
  imageUrls: string[],
): Promise<{ imageUrl: string }> {
  return maskyFetch(token, '/images/edit', {
    method: 'POST',
    body: JSON.stringify({ prompt, imageUrls: imageUrls.slice(0, 5) }),
  })
}

export function generateVideo(
  token: string,
  body: {
    prompt: string
    image?: string
    srcVideo?: string
    model?: string
    resolution?: string
    aspectRatio?: string
  },
): Promise<{ generationId: string; status: string; model: string }> {
  return maskyFetch(token, '/videos/generate', { method: 'POST', body: JSON.stringify(body) })
}

export function videoStatus(
  token: string,
  generationId: string,
): Promise<{ status: string; videoUrl?: string; model?: string; errorMessage?: string }> {
  return maskyFetch(token, `/videos/${generationId}`)
}
