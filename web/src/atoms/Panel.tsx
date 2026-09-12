import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/**
 * The steps a panel's own head takes on the boards. `Panel` paints `intro` on any bare `<h3>`/`<h4>`
 * it holds; a section whose board draws a bigger head reaches for `PanelHeading`, because the
 * descendant rule below is specific enough to outrank a size utility a consumer puts on its heading.
 */
const panelHeadingSizes = {
  /** 17/21 — the shared panel title, and what a bare `<h3>` inside a `Panel` already gets. */
  intro: 'text-intro',
  /** 18/22 — Settings/Developers section cards and the memeplex strip (`J52-0`, `MCT-0`, `G5X-0`). */
  section: 'text-[18px]/[22px] tracking-title',
  /** 22/28 — Mint's form and preview cards (`25K-0` › `G1D-0`, `G1V-0`). */
  card: 'text-[22px]/[28px] tracking-title',
  /** 24/30 — the Trade composer's head (`41N-0` › `LSH-0`). */
  composer: 'text-[24px]/[30px] tracking-title',
} as const

export interface PanelHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** The board's step for this card's head. Default `intro` = `Panel`'s own 17/21. */
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
 * display face at 17/21 — a panel title, not a page title — so an `<h3>` or `<h4>` is a drop-in.
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
        '[&_:where(h3,h4):not([data-slot=panel-heading])]:text-ink',
        className,
      )}
    >
      {children}
    </div>
  )
}
