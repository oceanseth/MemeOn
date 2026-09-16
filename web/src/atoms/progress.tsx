import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import type { Styled } from '@/atoms/field'

/**
 * The fill: the action colour, or the ladder sweep (brand → primary → brand) a meme's rank meter
 * wears. `value={null}` is indeterminate — Base UI sets `data-indeterminate` on every part and the
 * fill becomes a pulsing third of the track.
 */
export const progressIndicatorVariants = cva(
  cn(
    'h-full rounded-full transition-all',
    'data-indeterminate:w-1/3 data-indeterminate:animate-pulse motion-reduce:transition-none motion-reduce:animate-none!',
  ),
  {
    variants: {
      variant: {
        default: 'bg-primary',
        ladder: 'bg-linear-to-r from-brand via-primary to-brand',
        /** the braincell gold a binder's ownership groove fills with */
        braincell: 'bg-warning-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type ProgressProps = Styled<ProgressPrimitive.Root.Props> & VariantProps<typeof progressIndicatorVariants>

/**
 * Base UI owns the `progressbar` role and the `aria-value*` wiring; children (`ProgressLabel`,
 * `ProgressValue`) sit on the row above the track, which the root always renders.
 */
export function Progress({ className, children, value, variant, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5', className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator variant={variant} />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
}

export function ProgressTrack({ className, ...props }: Styled<ProgressPrimitive.Track.Props>) {
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={cn('relative flex h-1.5 w-full items-center overflow-hidden rounded-full bg-muted', className)}
      {...props}
    />
  )
}

export function ProgressIndicator({
  className,
  variant,
  ...props
}: Styled<ProgressPrimitive.Indicator.Props> & VariantProps<typeof progressIndicatorVariants>) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      data-variant={variant ?? 'default'}
      className={cn(progressIndicatorVariants({ variant }), className)}
      {...props}
    />
  )
}

export function ProgressLabel({ className, ...props }: Styled<ProgressPrimitive.Label.Props>) {
  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      className={cn('text-sm font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function ProgressValue({ className, ...props }: Styled<ProgressPrimitive.Value.Props>) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={cn('ml-auto text-sm text-muted-foreground tabular-nums', className)}
      {...props}
    />
  )
}
