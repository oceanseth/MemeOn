import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import './Skeleton.css'

/** The surface owns the shape (height/aspect-ratio); this recipe never changes. */
const BASE = cn(
  'relative overflow-hidden rounded-card border border-border bg-bg-raised',
  "after:content-[''] after:absolute after:inset-0 after:-translate-x-full",
  'after:bg-[linear-gradient(90deg,transparent,rgba(232,236,244,0.06),transparent)]',
  'after:animate-[skeleton-sweep_1.4s_linear_infinite] motion-reduce:after:animate-none',
)

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="skeleton" className={cn(BASE, className)} {...rest} />
}

/** An art square (content box) plus a 70px meta band, so a 270px track reserves 340px. */
export function SkeletonCard({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn(BASE, 'aspect-square box-content pb-[70px]', className)}
      {...rest}
    />
  )
}

export function SkeletonRow({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="skeleton-row" className={cn(BASE, 'min-h-16', className)} {...rest} />
}

export function SkeletonBlock({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="skeleton-block" className={cn(BASE, 'h-3.5 rounded-[8px] bg-bg-card', className)} {...rest} />
  )
}
