import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/**
 * Panel heading roles. `intro` is the default (and what a bare `<h3>`/`<h4>` inside `Panel` gets).
 * `section` shares intro — a 1px step is not a role. `card` is card-title; `composer` is title.
 */
const panelHeadingSizes = {
  intro: 'text-intro tracking-normal',
  section: 'text-intro tracking-normal',
  card: 'text-card-title tracking-card-title',
  composer: 'text-title tracking-title',
} as const

export interface PanelHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The board's step for this card's head. Default `intro`. */
  size?: keyof typeof panelHeadingSizes
  /** The level the document outline wants; the size is chosen separately, above. */
  as?: 'h2' | 'h3' | 'h4'
}

/**
 * A panel's head. It carries `data-slot="panel-heading"`, which is what takes it out of `Panel`'s
 * descendant rule — so the size here is the size that paints, at any level.
 */
export function PanelHeading({ size = 'intro', as, className, children, ...rest }: PanelHeadingProps) {
  const Tag = as ?? 'h3'
  return (
    <Tag
      data-slot="panel-heading"
      {...rest}
      className={cn('mt-0 mb-1.5 font-display font-medium text-ink', panelHeadingSizes[size], className)}
    >
      {children}
    </Tag>
  )
}

/**
 * A raised card with the section's own padding (24, 18 on the phone). Its optional heading is the
 * display face at intro — a panel title, not a page title — so an `<h3>` or `<h4>` is a drop-in.
 * A card whose board draws a different step uses `PanelHeading`, which this rule steps around.
 */
export function Panel({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="panel"
      {...rest}
      className={cn(
        'rounded-card border-0 bg-surface shadow-raised p-6 max-md:p-[18px]',
        '[&_:where(h3,h4):not([data-slot=panel-heading])]:mt-0',
        '[&_:where(h3,h4):not([data-slot=panel-heading])]:mb-1.5',
        '[&_:where(h3,h4):not([data-slot=panel-heading])]:text-intro',
        '[&_:where(h3,h4):not([data-slot=panel-heading])]:tracking-normal',
        '[&_:where(h3,h4):not([data-slot=panel-heading])]:text-ink',
        className,
      )}
    >
      {children}
    </div>
  )
}
