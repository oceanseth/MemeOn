import type { ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/atoms/collapsible'
import { Heading } from '@/atoms/heading'
import { cn } from '../lib/cn'

export interface FaqItemProps {
  /** The question, rendered inside the trigger's `<h3>` so the FAQ keeps a real heading outline. */
  question: ReactNode
  /** The answer body: prose, and any floated media (a `<p>` sibling image still floats). */
  children: ReactNode
  /** @default false */
  defaultOpen?: boolean
  className?: string
}

/** The raised card the question sits on; the phone and the desktop share it. */
const CARD = 'mb-2.5 rounded-lg material-raised'

const TRIGGER = cn(
  'group flex w-full min-h-hit cursor-pointer items-center gap-3 rounded-lg px-gutter py-3.5 text-left',
  'focus-ring',
)

const PANEL = 'px-gutter pb-4 text-base text-muted-foreground'

/**
 * One FAQ card: the `Collapsible` atom standing in for the pre-migration `<details>/<summary>`.
 * Reused by `DiscordPageScreen`'s FAQ (dev package) once that surface migrates off `<details>`.
 *
 * The atom is a pass-through with no variants of its own, so the card paints the three elements
 * it composes through Base UI's `render` prop rather than through their `className`
 * (`MO2/requests.md` asks for a `card` variant on the atom).
 *
 * API: `question` is the trigger's accessible name and heading text; `children` is the panel's
 * body, mounted only while open. `defaultOpen` matches `<details open>` for an uncontrolled item.
 */
export function FaqItem({ question, children, defaultOpen = false, className }: FaqItemProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      data-slot="faq-item"
      render={<div className={cn(CARD, className)} />}
    >
      <CollapsibleTrigger data-slot="faq-trigger" render={<button type="button" className={TRIGGER} />}>
        {/* no caret icon — the ▾ glyph rotates off the trigger's own `data-panel-open` */}
        <span
          aria-hidden="true"
          className="shrink-0 text-base text-muted-foreground transition-lift group-data-panel-open:rotate-180"
        >
          ▾
        </span>
        {/* Onest, not the display face a bare `<h3>` inherits: a question is a row label, and the
            row's height is its own line box */}
        <Heading as="h3" size="card-title-phone">
          {question}
        </Heading>
      </CollapsibleTrigger>
      <CollapsibleContent data-slot="faq-panel" render={<div className={PANEL} />}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
