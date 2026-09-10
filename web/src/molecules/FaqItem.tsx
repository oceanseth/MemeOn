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
  'group flex w-full min-h-11 cursor-pointer items-center gap-2 rounded-xl px-[18px] py-3.5 text-left font-semibold',
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset)',
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[Highlight]',
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
      className={cn('mb-2.5 rounded-xl border border-border bg-bg-raised', className)}
    >
      <Collapsible.Trigger className={TRIGGER} data-slot="faq-trigger">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-3 shrink-0 fill-current transition-transform duration-(--dur-base) group-data-[panel-open]:rotate-90 motion-reduce:transition-none"
        >
          <path d="M5 2.5 11 8l-6 5.5z" />
        </svg>
        <h3 className="m-0 text-base">{question}</h3>
      </Collapsible.Trigger>
      <Collapsible.Panel data-slot="faq-panel" className="px-[18px] pb-3.5 text-text-dim leading-[1.55]">
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}
