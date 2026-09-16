import { createContext, useContext } from 'react'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import type { Styled } from '@/atoms/field'
import { Toggle, type ToggleProps } from '@/atoms/toggle'

type ToggleGroupItemVariants = Pick<ToggleProps, 'variant' | 'size'>

/** The group hands its `variant`/`size` to every item, as the registry's toggle-group does. */
const ToggleGroupContext = createContext<ToggleGroupItemVariants>({})

/**
 * The group's own look follows the item variant it hosts: raised chips sit in a gapped row;
 * `segment` items sit inside the pressed well (the ThemeControl look — 40px tall at `size="sm"`:
 * 34px segments plus the 3px inset, which is why the well keeps `p-0.75`).
 */
export const toggleGroupVariants = cva('group/toggle-group flex items-center', {
  variants: {
    variant: {
      default: 'flex-wrap gap-2',
      ghost: 'flex-wrap gap-1',
      segment: 'w-fit gap-0.5 rounded-full material-pressed p-0.75',
    },
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col items-stretch',
    },
  },
  defaultVariants: {
    variant: 'default',
    orientation: 'horizontal',
  },
})

export type ToggleGroupProps<Value extends string = string> = Styled<ToggleGroupPrimitive.Props<Value>> &
  ToggleGroupItemVariants

export function ToggleGroup<Value extends string = string>({
  className,
  variant,
  size,
  orientation = 'horizontal',
  children,
  ...props
}: ToggleGroupProps<Value>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant ?? 'default'}
      data-size={size ?? 'default'}
      orientation={orientation}
      className={cn(toggleGroupVariants({ variant, orientation }), className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

/** A `Toggle` that reads its variant from the group; the group's choice wins over its own. */
export function ToggleGroupItem<Value extends string = string>({
  variant,
  size,
  ...props
}: ToggleProps<Value>) {
  const context = useContext(ToggleGroupContext)
  return (
    <Toggle
      data-slot="toggle-group-item"
      variant={context.variant ?? variant}
      size={context.size ?? size}
      {...props}
    />
  )
}
