import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import './spinner.css'

/**
 * A drawn ring, not the registry's lucide loader, and `aria-hidden` by default: the parent owns
 * the status (`aria-busy` on a Button, the live region beside a loading row), so a self-labelled
 * spinner would be announced twice. The turn itself is `spinner.css` (0.8s, a legacy constant
 * rather than a `--dur-*` token; slower, never still, under reduced motion).
 */
const spinnerVariants = cva('inline-block flex-none rounded-full forced-colors:border-fc-text forced-colors:border-t-fc-highlight', {
  variants: {
    size: {
      /** the 18px ring beside a label and inside a Button */
      sm: 'size-4.5 border-2',
      /** the 24px ring of a full-panel wait */
      md: 'size-6 border-3',
      /** the 38px ring a whole route waits on */
      lg: 'size-9.5 border-3',
    },
    tone: {
      default: 'border-border border-t-primary',
      /** inherits the host's text colour: a busy Button of any variant */
      current: 'border-current/30 border-t-current',
    },
  },
  defaultVariants: { size: 'sm', tone: 'default' },
})

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof spinnerVariants> {}

export function Spinner({ className, size, tone, ...rest }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="spinner"
      data-size={size ?? 'sm'}
      className={cn(spinnerVariants({ size, tone }), className)}
      {...rest}
    />
  )
}

export { spinnerVariants }
