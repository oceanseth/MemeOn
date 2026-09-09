import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface PageHeadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  subtitle?: ReactNode
  /** Heading-level agnostic: a screen can promote its title to <h1> with no size change. */
  level?: 'h1' | 'h2'
}

/** ≥761px: a direct FilterBar child absorbs the row's slack instead of clipping its own field. */
export function PageHead({ title, subtitle, level = 'h2', className, children, ...rest }: PageHeadProps) {
  const Heading: ElementType = level
  const heading = <Heading className="m-0 text-[24px]">{title}</Heading>
  return (
    <div
      {...rest}
      data-slot="page-head"
      className={cn(
        'mx-0 mt-7 mb-5 flex flex-wrap items-center justify-between gap-4',
        'xl:[&>[data-slot=filter-bar]]:flex-auto xl:[&>[data-slot=filter-bar]]:justify-end',
        className,
      )}
    >
      {subtitle ? (
        <div>
          {heading}
          <span data-slot="page-subtitle" className="text-sm text-text-dim">
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
