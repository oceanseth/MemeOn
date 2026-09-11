import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/**
 * `neutral` is the quiet count/label pill, `action` the one the design gives "For sale" (the
 * bubblegum/sky pill on a card), and the four status tones reuse the same surface/text pairs a
 * `Notice` wears, one size down.
 */
export type BadgeTone = 'neutral' | 'action' | 'success' | 'warning' | 'error' | 'info'

const BASE = cn(
  // pill: radius 12, padding 4/9, Onest 12/16 700 — components.md › tier chip geometry
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
  /** @default 'neutral' */
  tone?: BadgeTone
  /**
   * The relationship/status pill ("Friends", "You"): the same shape in the info pair, so a
   * standing fact never reads as the card's action. A `tone` passed explicitly still wins.
   */
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
