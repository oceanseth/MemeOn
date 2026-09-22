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
        /** Children reserve the 4:5 shell and width-responsive metadata inside this container. */
        card: '@container',
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
export function Skeleton({ className, variant, children, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant ?? 'default'}
      aria-hidden="true"
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    >
      {variant === 'card' ? (
        <>
          <span data-slot="skeleton-card-art" className="block aspect-4/5 w-full" />
          <span data-slot="skeleton-card-meta" className="block h-29 @max-card-narrow:h-35.5" />
        </>
      ) : (
        children
      )}
    </div>
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
