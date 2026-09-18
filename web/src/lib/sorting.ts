import type { Meme } from './types'

export type SortKey = 'new' | 'views' | 'reshares' | 'value'
export type SortDir = 'desc' | 'asc'

export function sortMemes<T extends Meme>(
  memes: readonly T[],
  key: SortKey,
  dir: SortDir,
): T[] {
  const multiplier = dir === 'desc' ? -1 : 1
  const value = (meme: Meme): number | string => {
    switch (key) {
      case 'views':
        return meme.views ?? meme.reshares
      case 'reshares':
        return meme.reshareCount ?? 0
      case 'value':
        return meme.value
      default:
        return meme.createdAt
    }
  }

  return [...memes].sort((a, b) => {
    const aValue = value(a)
    const bValue = value(b)
    if (aValue < bValue) return -1 * multiplier
    if (aValue > bValue) return multiplier
    return 0
  })
}
