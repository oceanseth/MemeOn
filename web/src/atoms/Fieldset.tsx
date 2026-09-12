import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset'
import type { FieldsetLegendProps, FieldsetRootProps } from '@base-ui/react/fieldset'
import { cn } from '../lib/cn'
import type { Styled } from './Field'

/** `.trade-fieldset`: a grouping element with no chrome of its own; `min-w-0` keeps it from stretching a grid. */
export function Fieldset({ className, ...props }: Styled<FieldsetRootProps>) {
  return (
    <BaseFieldset.Root
      className={cn('m-0 min-w-0 border-0 p-0', className)}
      {...props}
      data-slot="fieldset"
    />
  )
}

export function FieldsetLegend({ className, ...props }: Styled<FieldsetLegendProps>) {
  return (
    <BaseFieldset.Legend
      className={cn(
        'mb-2 p-0 text-micro font-bold tracking-[0.6px] text-ink-muted uppercase',
        className,
      )}
      {...props}
      data-slot="fieldset-legend"
    />
  )
}
