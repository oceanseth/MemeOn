import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

/** A pressed well with the highlight sweeping across it; `card` reserves a card slot's 340px. */
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
        card: 'aspect-square box-content pb-17.5',
        row: 'min-h-16',
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
