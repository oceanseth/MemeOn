import { createElement, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Card, CardTitle, type CardTitleProps, type CardTitleSize } from '@/atoms/card'

/* The names the screens wore before `card.tsx`: thin wrappers over `Card` and `CardTitle`, kept
   so every `<Panel>` site keeps compiling until its wave switches it. Deleted with the last site. */

const panelHeadingSizes = {
  intro: 'intro',
  section: 'intro',
  hero: 'card-title',
  card: 'card-title',
  composer: 'title',
} as const satisfies Record<string, CardTitleSize>

export interface PanelHeadingProps extends Omit<CardTitleProps, 'size' | 'render'> {
  size?: keyof typeof panelHeadingSizes
  as?: 'h2' | 'h3' | 'h4'
}

/** `<CardTitle size={…}>`; `as` is `render`, the 6px bottom margin is what the old heading carried. */
export function PanelHeading({ size = 'intro', as, className, ...rest }: PanelHeadingProps) {
  return (
    <CardTitle
      size={panelHeadingSizes[size]}
      {...(as ? { render: createElement(as) } : {})}
      className={cn('mb-1.5', className)}
      {...rest}
    />
  )
}

/* A bare h3/h4 inside a Panel still reads as intro: the descendant rule the screens that never
   adopted `PanelHeading` rely on. `CardTitle` opts out of it, and `Card` never has it. */
const LEGACY_HEADINGS = cn(
  '[&_:where(h3,h4):not([data-slot=card-title])]:mt-0',
  '[&_:where(h3,h4):not([data-slot=card-title])]:mb-1.5',
  '[&_:where(h3,h4):not([data-slot=card-title])]:font-sans',
  '[&_:where(h3,h4):not([data-slot=card-title])]:text-lg',
  '[&_:where(h3,h4):not([data-slot=card-title])]:font-semibold',
  '[&_:where(h3,h4):not([data-slot=card-title])]:text-foreground',
)

/** `<Card>` with the legacy heading rule, still `data-slot="panel"` for the one screen that selects it. */
export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <Card data-slot="panel" className={cn(LEGACY_HEADINGS, className)} {...rest} />
}
