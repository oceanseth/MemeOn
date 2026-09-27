import { useCallback, useSyncExternalStore } from 'react'
import { mediaSizes, memeMediaTargets, type MediaProbeTarget } from '../lib/memeMediaSize'
import type { Meme } from '../lib/types'

const SEPARATOR = '\n'

const encode = (targets: readonly MediaProbeTarget[]): string =>
  targets.map((target) => `${target.kind} ${target.url}`).join(SEPARATOR)

const decode = (key: string): MediaProbeTarget[] =>
  key
    ? key.split(SEPARATOR).map((line) => {
        const space = line.indexOf(' ')
        return {
          kind: line.slice(0, space) === 'video' ? 'video' : 'image',
          url: line.slice(space + 1),
        }
      })
    : []

/**
 * Measures the media of every meme a screen is about to frame, and re-renders the screen as the
 * sizes land. The probes start in `subscribe` — after the commit, never during a render — and
 * the subscription is renewed whenever the list of URLs changes, so a new page of the feed is
 * measured the moment it arrives. The card builders read the result through `memeMediaSize`;
 * the returned counter is only for memo dependencies.
 */
export function useMemeMediaSizes(memes: readonly (Meme | null | undefined)[]): number {
  const key = encode(memeMediaTargets(memes))
  const subscribe = useCallback(
    (listener: () => void) => {
      const unsubscribe = mediaSizes.subscribe(listener)
      mediaSizes.request(decode(key))
      return unsubscribe
    },
    [key],
  )
  return useSyncExternalStore(subscribe, mediaSizes.getSnapshot, mediaSizes.getSnapshot)
}
