import { Select as BaseSelect } from '@base-ui/react/select'
import { cn } from '../lib/cn'
import { controlChrome } from './Input'

export const SelectRoot = BaseSelect.Root
export const SelectTrigger = BaseSelect.Trigger
export const SelectValue = BaseSelect.Value
export const SelectIcon = BaseSelect.Icon
export const SelectPortal = BaseSelect.Portal
export const SelectPositioner = BaseSelect.Positioner
export const SelectPopup = BaseSelect.Popup
export const SelectList = BaseSelect.List
export const SelectItem = BaseSelect.Item
export const SelectItemText = BaseSelect.ItemText
export const SelectItemIndicator = BaseSelect.ItemIndicator

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean | undefined
}

export const selectTriggerChrome = cn(
  controlChrome,
  'inline-flex items-center justify-between gap-3 text-left',
  'data-[popup-open]:inset-ring-2 data-[popup-open]:inset-ring-action',
)

export const selectPopupChrome =
  'z-(--z-modal) max-h-[min(24rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto ' +
  'rounded-card border-0 bg-surface-raised p-1.5 text-ink shadow-pop'

export const selectItemChrome =
  'grid grid-cols-[1.25rem_1fr] min-h-11 items-center gap-2 rounded-field px-3 text-label ' +
  'cursor-default select-none outline-none ' +
  'data-[highlighted]:bg-surface-pressed data-[selected]:font-semibold ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--state-disabled-opacity)'

const CHECK = '✓'

export function Select({
  items,
  value,
  onValueChange,
  placeholder,
  disabled,
  name,
  id,
  className,
  'aria-label': ariaLabel,
}: {
  items: readonly SelectOption[]
  value?: string | null | undefined
  onValueChange?: ((value: string | null) => void) | undefined
  placeholder?: string | undefined
  disabled?: boolean | undefined
  name?: string | undefined
  id?: string | undefined
  className?: string | undefined
  'aria-label'?: string | undefined
}) {
  return (
    <SelectRoot
      items={items}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      id={id}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(selectTriggerChrome, className)}
        data-slot="select"
      >
        {/* invisible sizer keeps trigger width at the widest option */}
        <span className="grid min-w-0">
          <SelectValue placeholder={placeholder} className="[grid-area:1/1] truncate" />
          <span
            aria-hidden="true"
            className="[grid-area:1/1] invisible h-0 overflow-hidden"
            data-slot="select-sizer"
          >
            {placeholder === undefined ? null : <span className="block">{placeholder}</span>}
            {items.map((item) => (
              <span key={item.value} className="block">
                {item.label}
              </span>
            ))}
          </span>
        </span>
        <SelectIcon className="flex shrink-0 text-ink-muted" aria-hidden="true">
          <span className="after:content-['▾']" />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectPositioner sideOffset={6} alignItemWithTrigger={false} className="z-(--z-modal)">
          <SelectPopup className={selectPopupChrome} data-slot="select-popup">
            <SelectList aria-label={ariaLabel}>
              {items.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                  className={selectItemChrome}
                  data-slot="select-item"
                >
                  <SelectItemIndicator className="col-start-1 text-ink" aria-hidden="true">
                    {CHECK}
                  </SelectItemIndicator>
                  <SelectItemText className="col-start-2">{item.label}</SelectItemText>
                </SelectItem>
              ))}
            </SelectList>
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </SelectRoot>
  )
}
