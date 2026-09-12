import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export type BadgeTone = 'neutral' | 'action' | 'success' | 'warning' | 'error' | 'info'

const BASE = cn(
  'inline-block whitespace-nowrap rounded-chip border-0 px-[9px] py-1 text-micro font-bold',
)

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-pressed text-ink-muted',
  action: 'bg-action text-on-action',
  success: 'bg-success-surface text-success-text',
  warning: 'bg-warning-surface text-warning-text',
  error: 'bg-error-surface text-error-text',
  info: 'bg-info-surface text-info-text',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  /** Relationship/status pill; maps to info tone when true. */
  state?: boolean
}

export function Badge({ tone, state = false, className, ...rest }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-tone={tone ?? (state ? 'info' : 'neutral')}
      className={cn(BASE, TONE_CLASSES[tone ?? (state ? 'info' : 'neutral')], className)}
      {...rest}
    />
  )
}
