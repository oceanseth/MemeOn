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
        /** the strong red pair, for a count that must be seen: an unread bubble */
        destructive: 'bg-destructive text-destructive-foreground',
      },
      size: {
        default: '',
        /** a 16px disc on the corner of a 34px trigger: a number, nothing else */
        count: 'h-4 min-w-4 rounded-full px-1 leading-none tabular-nums',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export interface BadgeProps
  extends Omit<useRender.ComponentProps<'span'>, 'className'>,
    VariantProps<typeof badgeVariants> {
  className?: string | undefined
}

/** `render` swaps the span for a link or a button; the state reaches the DOM as `data-variant`. */
export function Badge({ className, variant, size, render, ...props }: BadgeProps) {
  const resolved = variant ?? 'default'
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      { className: cn(badgeVariants({ variant: resolved, size }), className) },
      props,
    ),
    render,
    state: { slot: 'badge', variant: resolved, size: size ?? 'default' },
  })
}

export { badgeVariants }
