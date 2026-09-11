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
        // a raised card, centred column: title 23/29 display, body 16/24 muted
        'rounded-card border-0 bg-surface shadow-raised px-5 py-15 text-center text-body text-ink-muted',
        '[&_:where(h2,h3)]:mt-0 [&_:where(h2,h3)]:mb-1.5 [&_:where(h2,h3)]:text-title [&_:where(h2,h3)]:text-ink',
        '[&_p]:m-0 [&_p]:mb-1.5 [&_p]:text-body',
        error &&
          'bg-error-surface text-error-text [&_:where(h2,h3)]:text-error-text [&_strong]:text-error-text',
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
    <div {...rest} data-slot="page-state" className={cn('pt-20 text-center text-ink-muted', className)}>
      {children}
    </div>
  )
}

export function Muted({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest} data-slot="muted" className={cn('text-ink-muted', className)} />
}
