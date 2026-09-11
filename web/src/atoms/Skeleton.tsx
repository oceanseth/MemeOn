import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import './Skeleton.css'

/** The surface owns the shape (height/aspect-ratio); this recipe never changes. */
const BASE = cn(
  // the recessed well the loading boards draw, swept by the material's own highlight
  'relative overflow-hidden rounded-card border-0 bg-surface-pressed shadow-pressed',
  "after:content-[''] after:absolute after:inset-0 after:-translate-x-full",
  'after:bg-[linear-gradient(90deg,transparent,var(--color-highlight),transparent)]',
  'after:animate-[atom-skeleton-sweep_1.4s_linear_infinite] motion-reduce:after:animate-none',
)

/** Decorative, content-less placeholders default `aria-hidden`, matching `Spinner`; overridable via props. */
export function Skeleton({ className, 'aria-hidden': ariaHidden, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="skeleton" aria-hidden={ariaHidden ?? 'true'} className={cn(BASE, className)} {...rest} />
  )
}

/** An art square (content box) plus a 70px meta band, so a 270px track reserves 340px. */
export function SkeletonCard({ className, 'aria-hidden': ariaHidden, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton-card"
      aria-hidden={ariaHidden ?? 'true'}
      className={cn(BASE, 'aspect-square box-content pb-[70px]', className)}
      {...rest}
    />
  )
}

export function SkeletonRow({ className, 'aria-hidden': ariaHidden, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton-row"
      aria-hidden={ariaHidden ?? 'true'}
      className={cn(BASE, 'min-h-16', className)}
      {...rest}
    />
  )
}

export function SkeletonBlock({ className, 'aria-hidden': ariaHidden, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton-block"
      aria-hidden={ariaHidden ?? 'true'}
      className={cn(BASE, 'h-3.5 rounded-[8px]', className)}
      {...rest}
    />
  )
}
