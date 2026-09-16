import { Select as BaseSelect } from '@base-ui/react/select'
import { cva, type VariantProps } from 'class-variance-authority'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { Styled } from '@/atoms/field'
import { inputVariants } from '@/atoms/input'
import { cn } from '@/lib/cn'

/** The primitive root; `Select` below is the items-array convenience the screens use. */
export const SelectRoot = BaseSelect.Root

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean | undefined
}

/** `default` is the recessed well; `pill` is the raised toolbar pill (the market's tier filter). */
export const selectTriggerVariants = cva(
  [
    inputVariants(),
    'inline-flex items-center justify-between gap-3 text-left',
    'data-popup-open:inset-ring-2 data-popup-open:inset-ring-primary',
  ],
  {
    variants: {
      variant: {
        default: '',
        pill: 'h-control rounded-lg material-raised font-semibold transition-press lift',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function SelectTrigger({
  className,
  variant,
  children,
  ...props
}: Styled<BaseSelect.Trigger.Props> & VariantProps<typeof selectTriggerVariants>) {
  return (
    <BaseSelect.Trigger
      data-slot="select-trigger"
      data-variant={variant ?? 'default'}
      className={cn(selectTriggerVariants({ variant }), className)}
      {...props}
    >
      {children}
      {/* the svg is the child, not the `render` element: Base UI's Icon merges a default "▼" into
          whatever it renders, and that glyph would land inside the svg and in the trigger's text */}
      <BaseSelect.Icon
        data-slot="select-icon"
        className="pointer-events-none flex shrink-0 text-muted-foreground"
      >
        <ChevronDownIcon className="size-4" />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  )
}

export function SelectValue({ className, ...props }: Styled<BaseSelect.Value.Props>) {
  return (
    <BaseSelect.Value
      data-slot="select-value"
      className={cn('block min-w-0 truncate text-left', className)}
      {...props}
    />
  )
}

/**
 * An invisible copy of every label under the value, so the trigger is as wide as its widest
 * option and a toolbar never shifts when the choice changes. Stack it with `SelectValue` in a grid.
 */
export function SelectSizer({
  items,
  placeholder,
  className,
  ...props
}: ComponentPropsWithoutRef<'span'> & { items: readonly SelectOption[]; placeholder?: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      data-slot="select-sizer"
      className={cn('invisible h-0 overflow-hidden', className)}
      {...props}
    >
      {placeholder === undefined ? null : <span className="block">{placeholder}</span>}
      {items.map((item) => (
        <span key={item.value} className="block">
          {item.label}
        </span>
      ))}
    </span>
  )
}

/**
 * Portal → positioner → popup → list. Ours opens 6px under the trigger as a menu
 * (`alignItemWithTrigger` off) at the modal layer, fades in and unmounts at once: the registry's
 * exit animation leaves a closed listbox in the DOM for a beat, which is a second `listbox` for
 * anything that queries by role and an unnamed field for axe. `aria-label` / `aria-labelledby`
 * name the listbox.
 */
export function SelectContent({
  className,
  children,
  side,
  sideOffset = 6,
  align,
  alignOffset,
  alignItemWithTrigger = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: Styled<BaseSelect.Popup.Props> &
  Pick<BaseSelect.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'alignItemWithTrigger'>) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-(--z-modal)"
      >
        <BaseSelect.Popup
          data-slot="select-content"
          className={cn(
            'relative isolate z-(--z-modal) max-h-(--available-height) min-w-(--anchor-width)',
            'origin-(--transform-origin) overflow-x-hidden overflow-y-auto',
            'rounded-lg material-pop p-1.5 text-foreground',
            'duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
            'motion-reduce:animate-none!',
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          {/* an explicit `undefined` would overwrite the label Base UI derives from the trigger */}
          <BaseSelect.List
            {...(ariaLabel === undefined ? {} : { 'aria-label': ariaLabel })}
            {...(ariaLabelledBy === undefined ? {} : { 'aria-labelledby': ariaLabelledBy })}
          >
            {children}
          </BaseSelect.List>
          <SelectScrollDownButton />
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  )
}

export function SelectGroup({ className, ...props }: Styled<BaseSelect.Group.Props>) {
  return <BaseSelect.Group data-slot="select-group" className={cn('scroll-my-1 p-1', className)} {...props} />
}

export function SelectLabel({ className, ...props }: Styled<BaseSelect.GroupLabel.Props>) {
  return (
    <BaseSelect.GroupLabel
      data-slot="select-label"
      className={cn('px-3 py-1 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

/** A 44px row; the check sits in a fixed lane on the left so labels line up. */
export function SelectItem({ className, children, ...props }: Styled<BaseSelect.Item.Props>) {
  return (
    <BaseSelect.Item
      data-slot="select-item"
      className={cn(
        'flex min-h-hit w-full cursor-default items-center gap-2 rounded-md px-3 text-base',
        'select-none outline-none',
        'data-highlighted:bg-muted data-selected:font-semibold',
        'disabled-look',
        className,
      )}
      {...props}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        <BaseSelect.ItemIndicator data-slot="select-item-indicator">
          <CheckIcon className="size-4" />
        </BaseSelect.ItemIndicator>
      </span>
      <BaseSelect.ItemText className="min-w-0 flex-1">{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  )
}

export function SelectSeparator({ className, ...props }: Styled<BaseSelect.Separator.Props>) {
  return (
    <BaseSelect.Separator
      data-slot="select-separator"
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

export function SelectScrollUpButton({ className, ...props }: Styled<BaseSelect.ScrollUpArrow.Props>) {
  return (
    <BaseSelect.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn('top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1', className)}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </BaseSelect.ScrollUpArrow>
  )
}

export function SelectScrollDownButton({ className, ...props }: Styled<BaseSelect.ScrollDownArrow.Props>) {
  return (
    <BaseSelect.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn('bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1', className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </BaseSelect.ScrollDownArrow>
  )
}

export interface SelectProps extends VariantProps<typeof selectTriggerVariants> {
  items: readonly SelectOption[]
  value?: string | null | undefined
  onValueChange?: ((value: string | null) => void) | undefined
  placeholder?: string | undefined
  disabled?: boolean | undefined
  name?: string | undefined
  id?: string | undefined
  className?: string | undefined
  'aria-label'?: string | undefined
}

/**
 * The one-liner the screens use: a labelled trigger sized to its widest option, and the list.
 * Its trigger is the component's own slot (`data-slot="select"`); a trigger composed from the
 * parts is `select-trigger`.
 */
export function Select({
  items,
  value,
  onValueChange,
  placeholder,
  disabled,
  name,
  id,
  className,
  variant,
  'aria-label': ariaLabel,
}: SelectProps) {
  return (
    <SelectRoot
      items={items}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      id={id}
    >
      <SelectTrigger aria-label={ariaLabel} variant={variant} className={className} data-slot="select">
        <span className="grid min-w-0">
          <SelectValue placeholder={placeholder} className="col-start-1 row-start-1" />
          <SelectSizer items={items} placeholder={placeholder} className="col-start-1 row-start-1" />
        </span>
      </SelectTrigger>
      <SelectContent aria-label={ariaLabel}>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  )
}
