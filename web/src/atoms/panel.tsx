import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

const panelHeadingSizes = {
  intro: 'text-intro tracking-normal',
  section: 'text-intro tracking-normal',
  hero: 'text-card-heading tracking-card-heading',
  card: 'text-card-title tracking-card-title',
  composer: 'text-title tracking-title',
} as const

export interface PanelHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  size?: keyof typeof panelHeadingSizes
  as?: 'h2' | 'h3' | 'h4'
}

/** Panel head; `data-slot` opts out of `Panel`'s default h3/h4 styling. */
export function PanelHeading({ size = 'intro', as, className, children, ...rest }: PanelHeadingProps) {
  const Tag = as ?? 'h2'
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

/** Raised card; bare h3/h4 get intro styling unless wrapped in `PanelHeading`. */
export function Panel({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="panel"
      {...rest}
      className={cn(
        'rounded-card border-0 bg-surface shadow-raised p-6 max-md:p-gutter',
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
