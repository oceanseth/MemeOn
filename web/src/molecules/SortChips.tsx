import type { SortChipsModel } from '../lib/sortChipsModel'

/** Click a stat to sort by it; click again to flip direction (↓/↑ indicator). */
export function SortChips({ model }: { model: SortChipsModel }) {
  return (
    <div className="sort-chips">
      {model.chips.map((chip) => (
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
