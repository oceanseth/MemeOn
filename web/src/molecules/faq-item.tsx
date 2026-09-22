import type { ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/atoms/collapsible'
import { Heading } from '@/atoms/heading'
import { Icon } from '@/atoms/icon'
export interface FaqItemProps {
  /** The question, rendered inside the trigger's `<h3>` so the FAQ keeps a real heading outline. */
  question: ReactNode
  /** The answer body: prose, and any floated media (a `<p>` sibling image still floats). */
  children: ReactNode
  /** @default false */
  defaultOpen?: boolean
  className?: string
}

/**
 * One FAQ card: the `Collapsible` atom standing in for the pre-migration `<details>/<summary>`.
 * Reused by `DiscordPageScreen`'s FAQ (dev package) once that surface migrates off `<details>`.
 *
 * The card is the atom's `card` variant: root, trigger and panel each carry their share of it.
 *
 * API: `question` is the trigger's accessible name and heading text; `children` is the panel's
 * body, mounted only while open. `defaultOpen` matches `<details open>` for an uncontrolled item.
 */
export function FaqItem({ question, children, defaultOpen = false, className }: FaqItemProps) {
  return (
    <Collapsible
      variant="card"
      defaultOpen={defaultOpen}
      data-slot="faq-item"
      {...(className === undefined ? {} : { className })}
    >
      <CollapsibleTrigger variant="card" data-slot="faq-trigger">
        {/* One caret, not a pair: it rotates off the trigger's own `data-panel-open`. `inline-flex`
            collapses the span onto the glyph's 18px box, and the half-turn pivots about that box —
            a text line box would be taller than the chevron and swing it off centre. */}
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 text-muted-foreground transition-lift group-data-panel-open:rotate-180"
        >
          <Icon name="chevron-down" size={18} />
        </span>
        {/* Onest, not the display face a bare `<h3>` inherits: a question is a row label, and the
            row's height is its own line box */}
        <Heading as="h3" size="card-title-phone">
          {question}
        </Heading>
      </CollapsibleTrigger>
      <CollapsibleContent variant="card" data-slot="faq-panel">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
