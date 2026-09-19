import { post } from './api'

const inFlight = new Map<string, Promise<void>>()

export function hasDiscordLinkInFlight(token: string): boolean {
  return inFlight.has(token)
}

/**
 * One POST /api/discord/link per in-flight token. Same token joins the Promise
 * (StrictMode remount). Do not abort. A settled attempt drops the lock so Try
 * again can POST.
 */
export function postDiscordLink(token: string): Promise<void> {
  const existing = inFlight.get(token)
  if (existing) return existing

  const request = post('/api/discord/link', { token }).then(
    () => {
      inFlight.delete(token)
    },
    (error: unknown) => {
      inFlight.delete(token)
      throw error
    },
  )
  inFlight.set(token, request)
  return request
}
