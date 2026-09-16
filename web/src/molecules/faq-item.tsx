import { Collapsible } from '@base-ui/react/collapsible'
import type { ReactNode } from 'react'
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

const TRIGGER = cn(
  'group flex w-full min-h-hit cursor-pointer items-center gap-3 rounded-lg px-gutter py-3.5 text-left',
  'focus-ring',
)

/**
 * One FAQ card: a Base UI Collapsible standing in for the pre-migration `<details>/<summary>`.
 * Reused by `DiscordPageScreen`'s FAQ (dev package) once that surface migrates off `<details>`.
 *
 * API: `question` is the trigger's accessible name and heading text; `children` is the panel's
 * body, mounted only while open. `defaultOpen` matches `<details open>` for an uncontrolled item.
 */
export function FaqItem({ question, children, defaultOpen = false, className }: FaqItemProps) {
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen}
      data-slot="faq-item"
      className={cn('mb-2.5 rounded-lg material-raised', className)}
    >
      <Collapsible.Trigger className={TRIGGER} data-slot="faq-trigger">
        {/* no caret icon — ▾ glyph rotates when open */}
        <span
          aria-hidden="true"
          className="shrink-0 text-base text-muted-foreground transition-lift group-data-panel-open:rotate-180"
        >
          ▾
        </span>
        {/* Onest, not the display face a bare `<h3>` inherits: a question is a row label, and the
            row's height is its own line box */}
        <h3 className="m-0 font-sans text-lg font-semibold text-foreground">{question}</h3>
      </Collapsible.Trigger>
      <Collapsible.Panel data-slot="faq-panel" className="px-gutter pb-4 text-base text-muted-foreground">
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
