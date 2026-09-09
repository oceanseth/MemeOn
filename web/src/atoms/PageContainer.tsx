import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Prose-width routes (Developers) keep their head inside the same measure as their copy. */
  narrow?: boolean
}

export function PageContainer({ narrow = false, className, children, ...rest }: PageContainerProps) {
  return (
    <div
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
    </div>
  )
}
