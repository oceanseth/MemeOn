import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/** The status pill: a tinted fill and the text that reads on it. */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-2 py-1 text-xs font-semibold focus-ring',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        primary: 'bg-primary text-primary-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        error: 'bg-error text-error-foreground',
        info: 'bg-info text-info-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

/** The pre-registry axis the screens still pass; `neutral` and `action` are `default` and `primary`. */
export type BadgeTone = 'neutral' | 'action' | 'success' | 'warning' | 'error' | 'info'

const TONE_VARIANT: Record<BadgeTone, BadgeVariant> = {
  neutral: 'default',
  action: 'primary',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
}

export interface BadgeProps extends Omit<useRender.ComponentProps<'span'>, 'className'>, VariantProps<typeof badgeVariants> {
  className?: string | undefined
  /** Legacy spelling of `variant`. */
  tone?: BadgeTone | undefined
}

/** `render` swaps the span for a link or a button; the state reaches the DOM as `data-variant`. */
export function Badge({ className, variant, tone, render, ...props }: BadgeProps) {
  const resolved = variant ?? (tone ? TONE_VARIANT[tone] : 'default')
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>({ className: cn(badgeVariants({ variant: resolved }), className) }, props),
    render,
    state: { slot: 'badge', variant: resolved },
  })
}

export { badgeVariants }
