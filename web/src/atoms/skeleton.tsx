import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

/** A pressed well with the highlight sweeping across it; `card` reserves a grid card's exact box. */
export const skeletonVariants = cva(
  [
    'relative overflow-hidden rounded-lg material-pressed',
    'after:absolute after:inset-0 after:-translate-x-full',
    'after:bg-linear-to-r after:from-transparent after:via-(--relief-highlight) after:to-transparent',
    'after:animate-sweep motion-reduce:after:animate-none',
  ],
  {
    variants: {
      variant: {
        default: '',
        /** a grid `MemeCard` is its square art plus 124px: the card inset (16) and the reserved
         *  meta — two title lines, the stats line, the two-line value row and their spacing */
        card: 'aspect-square box-content pb-31',
        row: 'min-h-16',
        /** stands in for an `Avatar size="hero"`: the same radius, the caller gives the size */
        avatar: 'rounded-xl',
        block: 'h-3.5 rounded-xs',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type SkeletonProps = ComponentPropsWithoutRef<'div'> & VariantProps<typeof skeletonVariants>

/** Decorative by default: the parent owns `aria-busy` or the loading text. */
export function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant ?? 'default'}
      aria-hidden="true"
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
}

export function SkeletonCard(props: ComponentPropsWithoutRef<'div'>) {
  return <Skeleton variant="card" {...props} data-slot="skeleton-card" />
}

export function SkeletonRow(props: ComponentPropsWithoutRef<'div'>) {
  return <Skeleton variant="row" {...props} data-slot="skeleton-row" />
}

export function SkeletonBlock(props: ComponentPropsWithoutRef<'div'>) {
  return <Skeleton variant="block" {...props} data-slot="skeleton-block" />
}
