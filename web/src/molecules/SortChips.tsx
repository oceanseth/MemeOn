import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Hint } from '../atoms/Field'
import { cn } from '../lib/cn'
import type { SortChipsModel } from '../lib/sortChipsModel'
import type { SortKey } from '../lib/sorting'

/* The filters are tabs, not buttons: a row of raised pills where the current sort is *pressed
   into* the surface. 46px tall (40 on a phone), radius-control, Onest 15/18 — the control scale
   `components.md` gives every pill. Selected outranks hover by material and weight, never by an
   accent colour, so the row still carries no primary action. */
const chipChrome = cn(
  'inline-flex h-[46px] items-center justify-center whitespace-nowrap max-sm:h-10',
  'rounded-control bg-surface-raised px-4 text-label/[18px] font-semibold text-ink shadow-raised',
  'cursor-pointer',
  '[transition:transform_var(--dur-fast)_ease,background_var(--dur-base)_ease]',
  'motion-reduce:transition-none',
  '[@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):hover]:-translate-y-px',
  'motion-reduce:[&:not(:disabled):hover]:translate-y-0!',
  'pointer-coarse:[&:not(:disabled):active]:translate-y-px',
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'forced-colors:focus-visible:outline-[Highlight]',
  'disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)',
  // the pressed well is the whole selected state: same colour family, opposite relief
  'data-[pressed]:bg-surface-pressed data-[pressed]:font-bold data-[pressed]:shadow-pressed',
  'data-[pressed]:translate-y-0!',
  'forced-colors:data-[pressed]:border forced-colors:data-[pressed]:border-[Highlight]',
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
              <span aria-hidden="true" className="ml-1 font-bold text-ink">
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
