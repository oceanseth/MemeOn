import { useMemo } from 'react'
import type { Meme } from '../types'

export type SortKey = 'new' | 'views' | 'reshares' | 'value'
export type SortDir = 'desc' | 'asc'

const CHIPS: { key: SortKey; label: string }[] = [
  { key: 'new', label: 'Newest' },
  { key: 'views', label: '👁️ Views' },
  { key: 'reshares', label: '🔁 Reshares' },
  { key: 'value', label: '🧠 Value' },
]

/**
 * Mechanism for the sort strip: which chip is active, which arrow it shows,
 * and what clicking it means (same stat → flip direction; new stat → desc).
 */
export function useSortChips({
  sortKey,
  dir,
  onChange,
}: {
  sortKey: SortKey
  dir: SortDir
  onChange: (key: SortKey, dir: SortDir) => void
}) {
  const chips = useMemo(
    () =>
      CHIPS.map((c) => {
        const active = c.key === sortKey
        return {
          key: c.key,
          label: c.label,
          active,
          arrow: active ? (dir === 'desc' ? '↓' : '↑') : null,
          buttonProps: {
            onClick: () => onChange(c.key, active ? (dir === 'desc' ? 'asc' : 'desc') : 'desc'),
          },
        }
      }),
    [sortKey, dir, onChange],
  )

  return useMemo(() => ({ chips }), [chips])
}

/** Sort a meme list by the same keys the chips expose. */
export function sortMemes<T extends Meme>(memes: T[], key: SortKey, dir: SortDir): T[] {
  const mul = dir === 'desc' ? -1 : 1
  const val = (m: Meme): number | string => {
    switch (key) {
      case 'views':
        return m.views ?? m.reshares
      case 'reshares':
        return m.reshareCount ?? 0
      case 'value':
        return m.value
      default:
        return m.createdAt
    }
  }
  return [...memes].sort((a, b) => {
    const av = val(a)
    const bv = val(b)
    if (av < bv) return -1 * mul
    if (av > bv) return 1 * mul
    return 0
  })
}
