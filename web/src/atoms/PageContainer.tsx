import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  /** Prose-width routes (Developers, legal). */
  narrow?: boolean
  as?: 'div' | 'main' | 'section'
}

/** Route content box; measure comes from the shell column. */
export function PageContainer({ as, narrow = false, className, children, ...rest }: PageContainerProps) {
  const Tag: ElementType = as ?? 'div'
  return (
    <Tag
      {...rest}
      data-slot="page-container"
      className={cn(
        'mx-auto w-full pt-0 pb-16',
        '[padding-inline:max(20px,env(safe-area-inset-left))_max(20px,env(safe-area-inset-right))]',
        narrow && 'max-w-[760px]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
