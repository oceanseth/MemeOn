import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/** Titles sit at <strong> weight, so an <h3>/<h4> is a drop-in. */
export function Panel({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      data-slot="panel"
      className={cn(
        'rounded-card border border-border bg-bg-card p-[18px]',
        '[&_:where(h3,h4)]:mt-0 [&_:where(h3,h4)]:mb-1.5 [&_:where(h3,h4)]:text-base',
        '[&_:where(h3,h4)]:font-bold [&_:where(h3,h4)]:text-text',
        className,
      )}
    >
      {children}
    </div>
  )
}
