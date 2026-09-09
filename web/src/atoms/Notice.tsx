import type { AriaRole, HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export type NoticeTone = 'error' | 'ok' | 'busy' | 'info'

const BASE = cn(
  'inline-block max-w-[60ch] text-left mt-3 mb-0 rounded-control px-3.5 py-2.5 text-sm',
  'contrast-more:border contrast-more:border-current',
)

const TONE_CLASSES: Record<NoticeTone, string> = {
  error: 'bg-(--state-error-bg) text-danger',
  ok: 'bg-(--state-success-bg) text-ok',
  busy: cn(
    'bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-accent',
    'border border-[color-mix(in_oklab,var(--color-accent)_35%,transparent)]',
  ),
  info: 'bg-bg-raised text-text-dim border border-border',
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
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={cn(BASE, TONE_CLASSES[tone], className)}
    >
      {children}
    </div>
  )
}
