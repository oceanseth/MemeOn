import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export type BadgeTone = 'neutral' | 'action' | 'success' | 'warning' | 'error' | 'info'

const BASE = cn(
  'inline-block whitespace-nowrap rounded-chip border-0 px-chip-x py-1 text-micro font-bold',
)

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  action: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  error: 'bg-error text-error-foreground',
  info: 'bg-info text-info-foreground',
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
