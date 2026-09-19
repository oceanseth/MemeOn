import type { Meme } from './types'

/**
 * Share-link load counter (drives the tier ladder). `reshares` is the legacy
 * name of the same metric — not uniqueRefs.
 */
export function memeViewCount(meme: Pick<Meme, 'views' | 'reshares'>): number {
  return meme.views ?? meme.reshares
}

/**
 * Distinct external sources (`uniqueRefs`). Missing means 0 — never fall back
 * to `meme.reshares` or `meme.views`.
 */
export function memeReshareCount(meme: Pick<Meme, 'reshareCount'>): number {
  return meme.reshareCount ?? 0
}
