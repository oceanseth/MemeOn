import { post } from './api'
import { clearDiscordLinkToken, getDiscordLinkConsent } from './sessionBus'

/**
 * One POST /api/discord/link per Discord token while a request is in flight.
 * StrictMode remounts share the promise. Do not abort: the token is single-use server-side.
 * A settled request (ok or fail) leaves the map so Try again can POST the same token again.
 */
const inflight = new Map<string, Promise<void>>()

export function discordLinkInFlight(token: string): boolean {
  return inflight.has(token)
}

export function shouldAutoLinkDiscord(token: string): boolean {
  return Boolean(getDiscordLinkConsent()) || discordLinkInFlight(token)
}

export function linkDiscordAccount(token: string): Promise<void> {
  const existing = inflight.get(token)
  if (existing) return existing
  clearDiscordLinkToken()
  const request = post('/api/discord/link', { token }).then(() => undefined)
  inflight.set(token, request)
  // Callers still observe rejection on `request`; this fork only drops the map entry.
  void request.finally(() => {
    if (inflight.get(token) === request) inflight.delete(token)
  }).then(() => undefined, () => undefined)
  return request
}
