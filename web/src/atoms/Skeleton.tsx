import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import './Skeleton.css'

const BASE = cn(
  'relative overflow-hidden rounded-card border-0 bg-surface-pressed shadow-pressed',
  "after:content-[''] after:absolute after:inset-0 after:-translate-x-full",
  'after:bg-[linear-gradient(90deg,transparent,var(--color-highlight),transparent)]',
  'after:animate-[atom-skeleton-sweep_1.4s_linear_infinite] motion-reduce:after:animate-none',
)

export function Skeleton({ className, 'aria-hidden': ariaHidden, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="skeleton" aria-hidden={ariaHidden ?? 'true'} className={cn(BASE, className)} {...rest} />
  )
}

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
