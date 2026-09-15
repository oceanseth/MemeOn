import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import type { NoticeTone } from '@/atoms/notice'

/** `neutral` plain surface; other tones match `Notice` vocabulary. */
export type EmptyStateTone = 'neutral' | NoticeTone

const TONE_CLASSES: Record<EmptyStateTone, string> = {
  neutral: 'bg-card [&_:where(h2,h3)]:text-foreground',
  error: 'bg-error [&_:where(h2,h3)]:text-error-foreground [&_strong]:text-error-foreground',
  ok: 'bg-success [&_:where(h2,h3)]:text-success-foreground',
  warning: 'bg-warning [&_:where(h2,h3)]:text-warning-foreground',
  info: 'bg-info [&_:where(h2,h3)]:text-info-foreground',
  busy: 'bg-info [&_:where(h2,h3)]:text-info-foreground',
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
        'rounded-lg material-card px-5 py-15 text-center text-label text-muted-foreground',
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
    <div {...rest} data-slot="page-state" className={cn('pt-20 text-center text-muted-foreground', className)}>
      {children}
    </div>
  )
}

export function Muted({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest} data-slot="muted" className={cn('text-muted-foreground', className)} />
}
