import type { AriaRole, HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/** `ok` and `busy` are the legacy names every screen already passes; they map onto the token pairs. */
export type NoticeTone = 'error' | 'ok' | 'warning' | 'busy' | 'info'

const BASE = cn(
  // radius 25, padding 16/18 — a soft card, not a hairline box
  'inline-block max-w-[60ch] text-left mt-3 mb-0 rounded-card border-0 px-[18px] py-4 text-label',
  'contrast-more:inset-ring-1 contrast-more:inset-ring-current',
)

const TONE_CLASSES: Record<NoticeTone, string> = {
  error: 'bg-error-surface text-error-text',
  ok: 'bg-success-surface text-success-text',
  warning: 'bg-warning-surface text-warning-text',
  /* in flight is information, not a fifth colour; the caller supplies the `<Spinner />` row */
  busy: 'bg-info-surface text-info-text',
  info: 'bg-info-surface text-info-text',
}

export interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  tone: NoticeTone
  role?: AriaRole
}

/** Mount before the copy arrives: `error` defaults to role="alert", the rest to role="status". */
export function Notice({ tone, role, className, children, ...rest }: NoticeProps) {
  return (
    <div
      {...rest}
      data-slot="notice"
      data-tone={tone}
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={cn(BASE, TONE_CLASSES[tone], className)}
    >
      {children}
    </div>
  )
}
