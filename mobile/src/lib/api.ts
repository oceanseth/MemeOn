import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE } from './config'

const SESSION_KEY = 'memeon_session'
const MASKY_KEY = 'masky_access_token'

let sessionCache: string | null = null
let maskyCache: string | null = null

export async function loadTokens(): Promise<boolean> {
  sessionCache = await AsyncStorage.getItem(SESSION_KEY)
  maskyCache = await AsyncStorage.getItem(MASKY_KEY)
  return !!sessionCache
}

export async function storeTokens(session: string, masky: string): Promise<void> {
  sessionCache = session
  maskyCache = masky
  await AsyncStorage.multiSet([
    [SESSION_KEY, session],
    [MASKY_KEY, masky],
  ])
}

export async function clearTokens(): Promise<void> {
  sessionCache = null
  maskyCache = null
  await AsyncStorage.multiRemove([SESSION_KEY, MASKY_KEY])
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  }
  if (sessionCache) headers.authorization = `Bearer ${sessionCache}`
  if (maskyCache) headers['x-masky-token'] = maskyCache

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  const text = await res.text()
  let data: unknown = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? `request failed (${res.status})`)
  }
  return data as T
}

export const post = <T>(path: string, body: unknown = {}): Promise<T> =>
  apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })
