import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  /** Prose-width routes (Developers, legal) keep their head inside the same 720px measure as their copy. */
  narrow?: boolean
  /** Every real call site wants the `<main id="main" tabIndex={-1}>` landmark, not a bare `<div>`. */
  as?: 'div' | 'main' | 'section'
}

/**
 * The route's box. It has no measure of its own: the shell's content column is the measure
 * (1108 at 1440, fluid below), and this box fills it. Its 20px gutter is the phone margin the
 * boards draw and, at 900+, the last 20 of the column's 276 = 20 + 216 + 20 + this
 * (`organisms/AppShell.tsx` › `CONTENT_APP`).
 */
export function PageContainer({ as, narrow = false, className, children, ...rest }: PageContainerProps) {
  const Tag: ElementType = as ?? 'div'
  return (
    <Tag
      {...rest}
      data-slot="page-container"
      className={cn(
        'mx-auto w-full pt-0 pb-16',
        '[padding-inline:max(20px,env(safe-area-inset-left))_max(20px,env(safe-area-inset-right))]',
        /* the 720 measure plus the gutter on each side */
        narrow && 'max-w-[760px]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
