import type { SortChipsModel } from '../lib/sortChipsModel'

/** Click a stat to sort by it; click again to flip direction (↓/↑ indicator). */
export function SortChips({ model }: { model: SortChipsModel }) {
  return (
    <div {...model.groupProps}>
      <div className="sort-chips">
        {model.chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`sort-chip ${chip.active ? 'active' : ''}`}
            {...chip.buttonProps}
          >
            {chip.label}
            {chip.arrow && (
              <span className="sort-arrow" aria-hidden="true">
                {chip.arrow}
              </span>
            )}
          </button>
        ))}
      </div>
      {model.reason && (
        <p className="field-hint" {...model.reasonProps}>
          {model.reason}
        </p>
      )}
    </div>
  )
}
