import { cva } from 'class-variance-authority'
import { createElement, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * The page title row: title (and its intro) on the left, whatever the screen puts beside it on
 * the right. From the `lg` cut a direct `FilterBar` child absorbs the row's slack instead of
 * clipping its own field.
 */
const pageHeadVariants = cva([
  'mx-0 mt-5 mb-6 flex flex-wrap items-center justify-between gap-4',
  'lg:*:data-[slot=filter-bar]:flex-auto lg:*:data-[slot=filter-bar]:justify-end',
])

/** Unbounded page title: the 5xl step, 4xl under the phone cut; the step carries its tracking. */
const HEADING = cn(
  'm-0 font-display text-5xl font-normal text-foreground text-balance',
  'max-md:text-4xl',
)

export interface PageHeadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  /** The page's introduction: Onest intro, muted, under the title. */
  subtitle?: ReactNode
  /** Heading-level agnostic: a screen can promote its title to <h1> with no size change. */
  level?: 'h1' | 'h2'
}

export function PageHead({ title, subtitle, level = 'h2', className, children, ...rest }: PageHeadProps) {
  const heading = createElement(level, { className: HEADING }, title)
  return (
    <div data-slot="page-head" className={cn(pageHeadVariants(), className)} {...rest}>
      {subtitle ? (
        <div className="min-w-0">
          {heading}
          <p data-slot="page-subtitle" className="mt-1.5 text-lg text-muted-foreground">
            {subtitle}
          </p>
        </div>
      ) : (
        heading
      )}
      {children}
    </div>
  )
}

/** Layout only; inputs, selects and buttons are supplied by the consumer. */
export function FilterBar({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="filter-bar" className={cn('flex flex-wrap items-center gap-2.5', className)} {...rest} />
}

export { pageHeadVariants }
