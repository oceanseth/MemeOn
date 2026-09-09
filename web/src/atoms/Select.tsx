import { Select as BaseSelect } from '@base-ui/react/select'
import { cn } from '../lib/cn'

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
export const SelectGroup = BaseSelect.Group
export const SelectGroupLabel = BaseSelect.GroupLabel
export const SelectSeparator = BaseSelect.Separator

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean | undefined
}

/** The native `<select>` chrome, plus the arrow gutter the browser used to reserve for itself. */
export const selectTriggerChrome =
  'inline-flex items-center justify-between gap-2 rounded-control border border-border-strong bg-bg-raised ' +
  'px-3 py-2 text-left text-[length:max(16px,1em)] leading-5 text-text ' +
  'focus:border-accent data-[popup-open]:border-accent ' +
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset) ' +
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[color:Highlight] ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--state-disabled-opacity) ' +
  'data-[invalid]:border-danger-border data-[invalid]:bg-(--state-error-bg) ' +
  'pointer-coarse:min-h-11'

export const selectPopupChrome =
  'z-(--z-modal) max-h-[min(24rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto ' +
  'rounded-control border border-border-strong bg-bg-raised py-1 text-text shadow-pop'

export const selectItemChrome =
  'grid grid-cols-[1rem_1fr] items-center gap-2 px-3 py-2 text-[length:max(16px,1em)] leading-[1.3] ' +
  'cursor-default select-none outline-none ' +
  'data-[highlighted]:bg-(--state-selected-bg) data-[selected]:text-accent ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--state-disabled-opacity) ' +
  'pointer-coarse:min-h-11'

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 6.25 8 10.25 12 6.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 16 16" fill="none">
      <path
        d="m3.5 8.5 3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
        <SelectValue placeholder={placeholder} className="min-w-0 truncate" />
        <SelectIcon className="flex shrink-0">
          <ChevronIcon />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        {/* the popup sits under the trigger rather than over the selected row: a menu, not a native picker */}
        <SelectPositioner sideOffset={4} alignItemWithTrigger={false} className="z-(--z-modal)">
          <SelectPopup className={selectPopupChrome} data-slot="select-popup">
            <SelectList>
              {items.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                  className={selectItemChrome}
                  data-slot="select-item"
                >
                  <SelectItemIndicator className="col-start-1 text-accent">
                    <CheckIcon />
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
