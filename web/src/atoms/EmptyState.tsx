import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import type { NoticeTone } from './Notice'

/**
 * `neutral` is the plain surface card; the rest are the tinted specimens the Feedback board draws
 * (`HSU-0`: `HV4-0` no-results, `HVD-0` retry, `HW9-0` starter pack opened, `HW2-0` unread
 * activity, `HWK-0` not enough braincells). The names are `Notice`'s, so one tone vocabulary
 * covers both the inline strip and the card — `ok` is the board's success card, `busy` its info.
 */
export type EmptyStateTone = 'neutral' | NoticeTone

/**
 * Per tone: the card's own fill and the colour its title takes. The body copy stays `ink-muted` in
 * every specimen on the board — the tint and the heading carry the state, the prose stays prose.
 */
const TONE_CLASSES: Record<EmptyStateTone, string> = {
  neutral: 'bg-surface [&_:where(h2,h3)]:text-ink',
  error: 'bg-error-surface [&_:where(h2,h3)]:text-error-text [&_strong]:text-error-text',
  ok: 'bg-success-surface [&_:where(h2,h3)]:text-success-text',
  warning: 'bg-warning-surface [&_:where(h2,h3)]:text-warning-text',
  info: 'bg-info-surface [&_:where(h2,h3)]:text-info-text',
  busy: 'bg-info-surface [&_:where(h2,h3)]:text-info-text',
}

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The tinted state card. Additive: the default is the neutral surface every existing caller
   * already gets. `error` and `tone="error"` are the same card; `error` also sets `role="alert"`.
   */
  tone?: EmptyStateTone | undefined
  error?: boolean
}

/**
 * A live region contract: mount before its text arrives, defaulting `role` the same way `Notice`
 * does (`error` → `alert`, otherwise `status`) so every consumer inherits the contract instead of
 * having to remember `role="status"`/`role="alert"` themselves. An explicit `role` still wins.
 *
 * The recipe is the board's state card: `radius-card`, the tone's surface, a 23/29 display title
 * on `--tracking-title` in the tone's text colour, 15/19 body on `ink-muted`, and a 46px action
 * row (`EmptyActions`) carrying at most one primary — a state card is one task.
 */
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
        // a raised card, centred column: title 23/29 display, body 15/19 muted
        'rounded-card border-0 shadow-raised px-5 py-15 text-center text-label text-ink-muted',
        '[&_:where(h2,h3)]:mt-0 [&_:where(h2,h3)]:mb-3 [&_:where(h2,h3)]:text-title',
        '[&_:where(h2,h3)]:tracking-title',
        '[&_p]:m-0 [&_p]:mb-1.5 [&_p]:text-label',
        TONE_CLASSES[resolved],
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * The retry / on-ramp slot; a direct Notice child sits on the row's centre line. 18 under the copy
 * and 10 between the 46px controls, as the board's CTA rows measure (`HV7-0`/`HV8-0`/`HVA-0`).
 */
export function EmptyActions({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      data-slot="empty-actions"
      className={cn(
        'mt-[18px] flex flex-wrap items-center justify-center gap-2.5',
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
