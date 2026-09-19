const SESSION_KEY = 'memeon_session'
const MASKY_KEY = 'masky_access_token'

export const sessionToken = (): string | null => localStorage.getItem(SESSION_KEY)
export const setSessionToken = (t: string): void => localStorage.setItem(SESSION_KEY, t)
export const maskyAccessToken = (): string | null => localStorage.getItem(MASKY_KEY)
export const setMaskyAccessToken = (t: string): void => localStorage.setItem(MASKY_KEY, t)

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(MASKY_KEY)
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Same-origin API call. Session JWT goes in Authorization; the Masky access
 * token rides along in x-masky-token for aigen endpoints (credit spend).
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('content-type')) headers.set('content-type', 'application/json')
  const session = sessionToken()
  if (session) headers.set('authorization', `Bearer ${session}`)
  const masky = maskyAccessToken()
  if (masky) headers.set('x-masky-token', masky)

  const res = await fetch(path, { ...init, headers })
  const text = await res.text()
  let data: unknown = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    const message =
      (data as { error?: string }).error ?? `${init.method ?? 'GET'} ${path} failed (${res.status})`
    throw new ApiError(res.status, message)
  }
  return data as T
}

export const post = <T>(path: string, body: unknown): Promise<T> =>
  apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })
