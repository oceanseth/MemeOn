import { cva } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * The label step: `small` at 600, one row so a leading control sits on the baseline. Dims when
 * Base UI marks it (`data-disabled`, through `FieldLabel`) or when its `peer` control is disabled.
 */
export const labelVariants = cva([
  'flex w-fit items-center gap-2 text-small font-semibold text-foreground select-none',
  'disabled-look peer-disabled:cursor-not-allowed peer-disabled:opacity-(--opacity-disabled)',
])

export function Label({ className, ...props }: ComponentPropsWithoutRef<'label'>) {
  return <label data-slot="label" className={cn(labelVariants(), className)} {...props} />
}
