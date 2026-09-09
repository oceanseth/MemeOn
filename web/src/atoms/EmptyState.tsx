import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  error?: boolean
}

/**
 * A live region contract: mount before its text arrives, defaulting `role` the same way `Notice`
 * does (`error` → `alert`, otherwise `status`) so every consumer inherits the contract instead of
 * having to remember `role="status"`/`role="alert"` themselves. An explicit `role` still wins.
 */
export function EmptyState({ error = false, role, className, children, ...rest }: EmptyStateProps) {
  return (
    <div
      {...rest}
      data-slot="empty-state"
      role={role ?? (error ? 'alert' : 'status')}
      className={cn(
        'rounded-card border border-dashed border-border px-5 py-15 text-center text-text-dim',
        '[&_:where(h2,h3)]:mt-0 [&_:where(h2,h3)]:mb-1.5 [&_:where(h2,h3)]:text-lg [&_:where(h2,h3)]:text-text',
        '[&_p]:m-0 [&_p]:mb-1.5',
        error &&
          'border-solid border-[#5b2733] bg-(--state-error-bg) text-danger [&_strong]:text-text',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** The retry / on-ramp slot; a direct Notice child sits on the row's centre line. */
export function EmptyActions({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      data-slot="empty-actions"
      className={cn(
        'mt-3.5 flex flex-wrap items-center justify-center gap-2.5',
        '[&>[data-slot=notice]]:my-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Centred page-level state (loading / not found / redirecting): one offset for every route. */
export function PageState({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} data-slot="page-state" className={cn('pt-20 text-center text-text-dim', className)}>
      {children}
    </div>
  )
}

export function Muted({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest} data-slot="muted" className={cn('text-text-dim', className)} />
}
