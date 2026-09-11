import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/**
 * A raised card with the section's own padding (24, 18 on the phone). Its optional heading is the
 * display face at 17/21 — a panel title, not a page title — so an `<h3>` or `<h4>` is a drop-in.
 */
export function Panel({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      data-slot="panel"
      className={cn(
        'rounded-card border-0 bg-surface shadow-raised p-6 max-md:p-[18px]',
        '[&_:where(h3,h4)]:mt-0 [&_:where(h3,h4)]:mb-1.5 [&_:where(h3,h4)]:text-intro',
        '[&_:where(h3,h4)]:text-ink',
        className,
      )}
    >
      {children}
    </div>
  )
}
