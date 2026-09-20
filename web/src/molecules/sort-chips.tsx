import { Hint } from '@/atoms/field'
import { ToggleGroup, ToggleGroupItem } from '@/atoms/toggle-group'
import { Icon } from '@/atoms/icon'
import type { SortChipsModel } from '../lib/sortChipsModel'
import type { SortKey } from '../lib/sorting'

/**
 * Click a stat to sort by it; click it again to flip direction (chevron-down, rotate-180 when asc).
 *
 * The row is the `ToggleGroup` atom at its chip size: tabs, not buttons, so the selected chip is a
 * pressed well and never an accent colour. Single-select, so re-pressing the selected chip empties
 * the group value — which is exactly the "same key, other way" gesture the model spends as `flip()`.
 */
export function SortChips({ model }: { model: SortChipsModel }) {
  return (
    <div>
      <ToggleGroup<SortKey>
        {...model.groupProps}
        data-slot="sort-chips"
        size="chip"
        disabled={model.disabled}
        value={[model.selected]}
        onValueChange={(next: SortKey[]) => {
          const [key] = next
          if (key) model.select(key)
          else model.flip()
        }}
      >
        {model.chips.map((chip) => (
          <ToggleGroupItem<SortKey>
            key={chip.key}
            value={chip.key}
            data-slot="sort-chip"
            {...chip.buttonProps}
          >
            {chip.icon && (
              <span aria-hidden="true">
                <Icon name={chip.icon} size={16} />
              </span>
            )}
            {chip.label}
            {chip.direction && (
              <span aria-hidden="true">
                {chip.direction === 'asc' ? (
                  <Icon name="chevron-down" size={16} className="rotate-180" />
                ) : (
                  <Icon name="chevron-down" size={16} />
                )}
              </span>
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {/* the standalone description (no `<Field>` here): the group names it through `aria-describedby` */}
      {model.reason && <Hint {...model.reasonProps}>{model.reason}</Hint>}
    </div>
  )
}
