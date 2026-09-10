import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Hint } from '../atoms/Field'
import { cn } from '../lib/cn'
import type { SortChipsModel } from '../lib/sortChipsModel'
import type { SortKey } from '../lib/sorting'

/** The button chrome at chip scale, with the selected fill winning over hover. */
const chipChrome = cn(
  'inline-flex items-center justify-center whitespace-nowrap',
  'rounded-pill border border-border-strong bg-bg-raised text-text',
  'px-[11px] py-[5px] text-xs cursor-pointer',
  'pointer-coarse:min-h-11',
  '[transition:transform_var(--dur-fast)_ease,border-color_var(--dur-base)_ease,background_var(--dur-base)_ease]',
  'motion-reduce:transition-none',
  '[&:not(:disabled):hover]:border-(--state-hover-border)',
  '[@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):hover]:-translate-y-px',
  'motion-reduce:[&:not(:disabled):hover]:translate-y-0!',
  'pointer-coarse:[&:not(:disabled):active]:translate-y-px',
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset)',
  'contrast-more:focus-visible:outline-3',
  'forced-colors:focus-visible:outline-[Highlight]',
  'disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity)',
  // selected outranks focus by fill and weight, not border colour, and survives the hover rule
  'data-[pressed]:border-(--state-selected-border) data-[pressed]:bg-(--state-selected-bg)',
  'data-[pressed]:font-semibold data-[pressed]:text-text',
  'data-[pressed]:shadow-[inset_0_0_0_1px_var(--state-selected-border)]',
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
        className="flex flex-wrap gap-1.5"
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
              <span aria-hidden="true" className="ml-1 font-extrabold text-accent">
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
