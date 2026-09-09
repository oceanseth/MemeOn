import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  /** Prose-width routes (Developers) keep their head inside the same measure as their copy. */
  narrow?: boolean
  /** Every real call site wants the `<main id="main" tabIndex={-1}>` landmark, not a bare `<div>`. */
  as?: 'div' | 'main' | 'section'
}

export function PageContainer({ as, narrow = false, className, children, ...rest }: PageContainerProps) {
  const Tag: ElementType = as ?? 'div'
  return (
    <Tag
      {...rest}
      data-slot="page-container"
      className={cn(
        'mx-auto max-w-page pt-0 pb-16',
        '[padding-inline:max(20px,env(safe-area-inset-left))_max(20px,env(safe-area-inset-right))]',
        narrow && 'max-w-[780px]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
