import { useSortChips } from './hooks/useSortChips'
import type { SortDir, SortKey } from './hooks/useSortChips'

export type { SortKey, SortDir }

/**
 * Click a stat to sort by it; click again to flip direction (↓/↑ indicator).
 *
 * Markup and styling only: which chip is active and what a click means live in
 * `useSortChips`.
 */
export function SortChips({
  sortKey,
  dir,
  onChange,
}: {
  sortKey: SortKey
  dir: SortDir
  onChange: (key: SortKey, dir: SortDir) => void
}) {
  const c = useSortChips({ sortKey, dir, onChange })

  return (
    <div className="sort-chips">
      {c.chips.map((chip) => (
        <button
          key={chip.key}
          className={`sort-chip ${chip.active ? 'active' : ''}`}
          {...chip.buttonProps}
        >
          {chip.label}
          {chip.arrow && <span className="sort-arrow">{chip.arrow}</span>}
        </button>
      ))}
    </div>
  )
}
