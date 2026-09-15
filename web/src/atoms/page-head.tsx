import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface PageHeadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  /** The page's introduction: Onest intro, ink-muted, under the title. */
  subtitle?: ReactNode
  /** Heading-level agnostic: a screen can promote its title to <h1> with no size change. */
  level?: 'h1' | 'h2'
}

/** Page title: Unbounded display (phone display under the cut), tracking −0.04em. */
const HEADING = cn(
  'm-0 font-display text-display font-medium tracking-display text-ink',
  'max-md:text-display-phone',
)

/** ≥761px: a direct FilterBar child absorbs the row's slack instead of clipping its own field. */
export function PageHead({ title, subtitle, level = 'h2', className, children, ...rest }: PageHeadProps) {
  const Heading: ElementType = level
  const heading = <Heading className={HEADING}>{title}</Heading>
  return (
    <div
      {...rest}
      data-slot="page-head"
      className={cn(
        'mx-0 mt-5 mb-6 flex flex-wrap items-center justify-between gap-4',
        'xl:[&>[data-slot=filter-bar]]:flex-auto xl:[&>[data-slot=filter-bar]]:justify-end',
        className,
      )}
    >
      {subtitle ? (
        <div className="min-w-0">
          {heading}
          <span data-slot="page-subtitle" className="mt-1.5 block text-intro text-ink-muted">
            {subtitle}
          </span>
        </div>
      ) : (
        heading
      )}
      {children}
    </div>
  )
}

/** Layout only; inputs, selects and buttons are supplied by the consumer. */
export function FilterBar({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} data-slot="filter-bar" className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {children}
    </div>
  )
}
