import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * A row of controls: `gap-4.5` between its slots, `align` for where
 * a single slot sits, `stack` to put the slots one above the other under the 720px cut. Layout
 * only — a filter row is not an ARIA toolbar, so Base UI's roving-focus Toolbar is not used.
 */
export const toolbarVariants = cva('flex flex-wrap items-center gap-4.5', {
  variants: {
    align: {
      start: 'justify-start',
      between: 'justify-between',
      end: 'justify-end',
    },
    stack: {
      true: 'max-lg:flex-col max-lg:items-stretch',
      false: '',
    },
  },
  defaultVariants: {
    align: 'start',
    stack: false,
  },
})

export type ToolbarProps = ComponentProps<'div'> & VariantProps<typeof toolbarVariants>

export function Toolbar({ className, align, stack, ...props }: ToolbarProps) {
  return (
    <div
      data-slot="toolbar"
      data-align={align ?? 'start'}
      className={cn(toolbarVariants({ align, stack }), className)}
      {...props}
    />
  )
}

/** The leading slot: controls at the control gap, shrinking before the row wraps. */
export function ToolbarStart({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="toolbar-start"
      className={cn('flex min-w-0 flex-wrap items-center gap-2.5', className)}
      {...props}
    />
  )
}

/** The trailing slot: pushed to the end of the row, its controls justified there too. */
export function ToolbarEnd({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="toolbar-end"
      className={cn('ml-auto flex flex-wrap items-center justify-end gap-2.5', className)}
      {...props}
    />
  )
}
