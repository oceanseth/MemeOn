import { apiFetch } from './api'

const inFlight = new Map<string, Promise<void>>()

export const DISCORD_LINK_TIMEOUT_MS = 30_000

export function hasDiscordLinkInFlight(token: string): boolean {
  return inFlight.has(token)
}

/**
 * One POST /api/discord/link per in-flight token. Same token joins the Promise
 * (StrictMode remount). Remount and useMountEffect cleanup must not abort.
 * The timeout is the only abort, and it aborts this POST only. Any settlement
 * drops the lock so Try again can POST. failureOf already maps a non-ApiError
 * abort to unreachable.
 */
export function postDiscordLink(token: string): Promise<void> {
  const existing = inFlight.get(token)
  if (existing) return existing

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DISCORD_LINK_TIMEOUT_MS)
  const drop = () => {
    clearTimeout(timer)
    inFlight.delete(token)
  }
  const request = apiFetch('/api/discord/link', {
    method: 'POST',
    body: JSON.stringify({ token }),
    signal: controller.signal,
  }).then(
    () => {
      drop()
    },
    (error: unknown) => {
      drop()
      throw error
    },
  )
  inFlight.set(token, request)
  return request
}
