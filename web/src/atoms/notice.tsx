import type { AriaRole, HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/** `ok` and `busy` are legacy names mapped onto token pairs. */
export type NoticeTone = 'error' | 'ok' | 'warning' | 'busy' | 'info'

const BASE = cn(
  'inline-block max-w-measure-sm text-left mt-3 mb-0 rounded-card border-0 px-gutter py-4 text-label',
  'contrast-more:inset-ring-1 contrast-more:inset-ring-current',
)

const TONE_CLASSES: Record<NoticeTone, string> = {
  error: 'bg-error-surface text-error-text',
  ok: 'bg-success-surface text-success-text',
  warning: 'bg-warning-surface text-warning-text',
  busy: 'bg-info-surface text-info-text',
  info: 'bg-info-surface text-info-text',
}

export interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  tone: NoticeTone
  role?: AriaRole
  /** Single-line messages use field radius instead of card radius. */
  compact?: boolean
}

export function Notice({ tone, role, compact = false, className, children, ...rest }: NoticeProps) {
  return (
    <div
      data-slot="notice"
      {...rest}
      data-tone={tone}
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={cn(BASE, TONE_CLASSES[tone], compact && 'rounded-field', className)}
    >
      {children}
    </div>
  )
}
