import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

const BASE = cn(
  'inline-block whitespace-nowrap rounded-pill border border-border text-text-dim',
  /* `leading-[normal]` is the CSS keyword (Tailwind's `leading-normal` is a fixed 1.5): the legacy
     `.badge` rule never set a line-height, so it rendered at the UA default off `body`. Preflight's
     `html { line-height: 1.5 }` would otherwise inflate the badge a few px taller. */
  'px-2 py-0.5 text-[11px] leading-[normal] font-bold uppercase tracking-[0.6px]',
)

/** Relationship/status at full opacity, so success never wears the disabled skin. */
const STATE_CLASSES = cn(
  'border-accent bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)] text-text',
  'px-2.5 py-1 text-[12px] leading-[normal] normal-case tracking-[0.2px]',
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  state?: boolean
}

export function Badge({ state = false, className, ...rest }: BadgeProps) {
  return <span data-slot="badge" className={cn(BASE, state && STATE_CLASSES, className)} {...rest} />
}
