import type { AriaRole, HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/** `ok` and `busy` are legacy names mapped onto token pairs. */
export type NoticeTone = 'error' | 'ok' | 'warning' | 'busy' | 'info'

const BASE = cn(
  'inline-block max-w-[60ch] text-left mt-3 mb-0 rounded-lg border-0 px-gutter py-4 text-label',
  'contrast-more:inset-ring-1 contrast-more:inset-ring-current',
)

const TONE_CLASSES: Record<NoticeTone, string> = {
  error: 'bg-error text-error-foreground',
  ok: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  busy: 'bg-info text-info-foreground',
  info: 'bg-info text-info-foreground',
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
      className={cn(BASE, TONE_CLASSES[tone], compact && 'rounded-md', className)}
    >
      {children}
    </div>
  )
}
