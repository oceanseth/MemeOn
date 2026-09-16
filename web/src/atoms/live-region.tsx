import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * `hidden` is the announce-only region a screen reader hears and nobody sees; `visible` is the
 * wrapper a Notice lands in, collapsing while it has nothing to say (`:empty`). Callers add the
 * layout around it (`not-empty:mb-4`).
 */
export const liveRegionVariants = cva('', {
  variants: {
    variant: {
      hidden: 'sr-only',
      visible: 'empty:hidden',
    },
  },
  defaultVariants: {
    variant: 'hidden',
  },
})

export type LiveRegionPoliteness = 'polite' | 'assertive'

export interface LiveRegionProps extends ComponentProps<'div'>, VariantProps<typeof liveRegionVariants> {
  /** `polite` reads as `role="status"`, `assertive` as `role="alert"`; an explicit `role` wins. */
  politeness?: LiveRegionPoliteness | undefined
  /** @default true */
  atomic?: boolean | undefined
}

export function LiveRegion({
  politeness = 'polite',
  atomic = true,
  variant,
  role,
  className,
  ...props
}: LiveRegionProps) {
  return (
    <div
      data-slot="live-region"
      data-variant={variant ?? 'hidden'}
      role={role ?? (politeness === 'assertive' ? 'alert' : 'status')}
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn(liveRegionVariants({ variant }), className)}
      {...props}
    />
  )
}
