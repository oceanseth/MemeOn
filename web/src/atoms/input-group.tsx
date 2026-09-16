import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef, MouseEvent } from 'react'
import { Input } from '@/atoms/input'
import { cn } from '@/lib/cn'

/**
 * One well with addons: the glyph or text sits inside the recess beside a chromeless control.
 * The group carries the ring, the invalid ring and the disabled look for whatever it holds.
 * Children go in visual order (a start addon before the control, an end addon after it).
 */
export function InputGroup({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      role="group"
      data-slot="input-group"
      className={cn(
        'group/input-group relative flex h-12.5 w-full min-w-0 items-center rounded-md material-pressed',
        // the control dims itself (`disabled-look` on Input); dimming the group would push an
        // addon's muted text under the contrast floor, and axe reads it as text either way
        'has-disabled:cursor-not-allowed',
        'focus-ring-within',
        'has-aria-invalid:inset-ring-2 has-aria-invalid:inset-ring-destructive',
        'has-data-invalid:inset-ring-2 has-data-invalid:inset-ring-destructive',
        className,
      )}
      {...props}
    />
  )
}

export const inputGroupAddonVariants = cva(
  'flex h-auto shrink-0 cursor-text items-center justify-center gap-2 text-base text-muted-foreground select-none',
  {
    variants: {
      align: {
        'inline-start': 'pl-4.5',
        'inline-end': 'pr-4.5',
      },
    },
    defaultVariants: { align: 'inline-start' },
  },
)

/** A click on the addon (but not on a button inside it) focuses the group's control. */
export function InputGroupAddon({
  className,
  align,
  onClick,
  ...props
}: ComponentPropsWithoutRef<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  const focusControl = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || (event.target as HTMLElement).closest('button')) return
    event.currentTarget.parentElement?.querySelector('input')?.focus()
  }
  return (
    <div
      data-slot="input-group-addon"
      data-align={align ?? 'inline-start'}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={focusControl}
      {...props}
    />
  )
}

export function InputGroupText({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      data-slot="input-group-text"
      className={cn('flex items-center gap-2 text-base text-muted-foreground', className)}
      {...props}
    />
  )
}

/** The well's control without its own chrome: the group paints the material, ring and rings. */
export function InputGroupInput({ className, ...props }: ComponentPropsWithoutRef<typeof Input>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        'h-full flex-1 rounded-none bg-transparent px-3 shadow-none first:pl-4.5 last:pr-4.5',
        'focus-visible:outline-none',
        'data-invalid:inset-ring-0 aria-invalid:inset-ring-0',
        className,
      )}
      {...props}
    />
  )
}
