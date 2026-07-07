import type { Meme } from '../lib/types'

export type SortKey = 'new' | 'views' | 'reshares' | 'value'
export type SortDir = 'desc' | 'asc'

const CHIPS: { key: SortKey; label: string }[] = [
  { key: 'new', label: 'Newest' },
  { key: 'views', label: '👁️ Views' },
  { key: 'reshares', label: '🔁 Reshares' },
  { key: 'value', label: '🧠 Value' },
]

/** Click a stat to sort by it; click again to flip direction (↓/↑ indicator). */
export function SortChips({
  sortKey,
  dir,
  onChange,
}: {
  sortKey: SortKey
  dir: SortDir
  onChange: (key: SortKey, dir: SortDir) => void
}) {
  return (
    <div className="sort-chips">
      {CHIPS.map((c) => {
        const active = c.key === sortKey
        return (
          <button
            key={c.key}
            className={`sort-chip ${active ? 'active' : ''}`}
            onClick={() =>
              onChange(c.key, active ? (dir === 'desc' ? 'asc' : 'desc') : 'desc')
            }
          >
            {c.label}
            {active && <span className="sort-arrow">{dir === 'desc' ? '↓' : '↑'}</span>}
          </button>
        )
      })}
    </div>
  )
}

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
