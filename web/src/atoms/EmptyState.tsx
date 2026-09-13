import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import type { NoticeTone } from './Notice'

/** `neutral` plain surface; other tones match `Notice` vocabulary. */
export type EmptyStateTone = 'neutral' | NoticeTone

const TONE_CLASSES: Record<EmptyStateTone, string> = {
  neutral: 'bg-surface [&_:where(h2,h3)]:text-ink',
  error: 'bg-error-surface [&_:where(h2,h3)]:text-error-text [&_strong]:text-error-text',
  ok: 'bg-success-surface [&_:where(h2,h3)]:text-success-text',
  warning: 'bg-warning-surface [&_:where(h2,h3)]:text-warning-text',
  info: 'bg-info-surface [&_:where(h2,h3)]:text-info-text',
  busy: 'bg-info-surface [&_:where(h2,h3)]:text-info-text',
}

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Additive; default is neutral. `error` also sets `role="alert"`. */
  tone?: EmptyStateTone | undefined
  error?: boolean
}

/** Live region: defaults `role` like `Notice`; explicit `role` wins. */
export function EmptyState({
  tone,
  error = false,
  role,
  className,
  children,
  ...rest
}: EmptyStateProps) {
  const resolved: EmptyStateTone = tone ?? (error ? 'error' : 'neutral')
  return (
    <div
      data-slot="empty-state"
      {...rest}
      data-tone={resolved}
      role={role ?? (error || resolved === 'error' ? 'alert' : 'status')}
      className={cn(
        'rounded-card border-0 shadow-raised px-5 py-15 text-center text-label text-ink-muted',
        '[&_:where(h2,h3)]:mt-0 [&_:where(h2,h3)]:mb-3 [&_:where(h2,h3)]:text-card-title',
        '[&_:where(h2,h3)]:tracking-card-title',
        '[&_p]:m-0 [&_p]:mb-1.5 [&_p]:text-label',
        TONE_CLASSES[resolved],
        className,
      )}
    >
      {children}
    </div>
  )
}

/** CTA row under empty-state copy. */
export function EmptyActions({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      data-slot="empty-actions"
      className={cn(
        'mt-gutter flex flex-wrap items-center justify-center gap-2.5',
        '[&>[data-slot=notice]]:my-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Centred page-level state (loading / not found / redirecting). */
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
