import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Hint } from '@/atoms/field'
import { cn } from '../lib/cn'
import type { SortChipsModel } from '../lib/sortChipsModel'
import type { SortKey } from '../lib/sorting'

/* Tabs, not buttons: selected = pressed well; material change only, never accent colour. */
const chipChrome = cn(
  'inline-flex h-control items-center justify-center whitespace-nowrap max-sm:h-10',
  /* 40px drawn height; coarse pointer still needs 44 */
  'pointer-coarse:min-h-hit',
  'rounded-lg material-raised px-4 text-label/4.5 font-semibold text-foreground',
  'cursor-pointer',
  'transition-press lift press',
  'focus-ring',
  'disabled-look',
  /* selected = pressed well; label weight stays 600 on every tab */
  'data-pressed:material-pressed',
  'data-pressed:translate-y-0!',
  'forced-colors:data-pressed:border forced-colors:data-pressed:border-fc-highlight',
)

/**
 * Click a stat to sort by it; click it again to flip direction (↓/↑ indicator).
 *
 * Single-select `ToggleGroup`, so re-pressing the selected chip empties the group value — which is
 * exactly the "same key, other way" gesture the model spends as `flip()`.
 */
export function SortChips({ model }: { model: SortChipsModel }) {
  return (
    <div>
      <ToggleGroup
        {...model.groupProps}
        className="flex flex-wrap gap-2"
        data-slot="sort-chips"
        disabled={model.disabled}
        value={[model.selected]}
        onValueChange={(next: SortKey[]) => {
          const [key] = next
          if (key) model.select(key)
          else model.flip()
        }}
      >
        {model.chips.map((chip) => (
          <Toggle
            key={chip.key}
            value={chip.key}
            className={chipChrome}
            data-slot="sort-chip"
            {...chip.buttonProps}
          >
            {chip.label}
            {chip.arrow && (
              <span aria-hidden="true" className="ml-1 font-bold text-foreground">
                {chip.arrow}
              </span>
            )}
          </Toggle>
        ))}
      </ToggleGroup>
      {model.reason && <Hint {...model.reasonProps}>{model.reason}</Hint>}
    </div>
  )
}
