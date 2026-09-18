import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

/**
 * A link inside prose. `inline` is the ultraviolet underline every body link wears; `strong`
 * adds weight for a link that is the sentence's point; `quiet` is ink for a way out beside a
 * primary control. Rendered as a router `Link` through `render`, or an `<a>` by default.
 */
export const inlineLinkVariants = cva('rounded-xs underline underline-offset-3 decoration-1 focus-ring', {
  variants: {
    variant: {
      inline: 'text-link',
      strong: 'text-link font-semibold',
      quiet: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'inline',
  },
})

export type InlineLinkProps = useRender.ComponentProps<'a'> & VariantProps<typeof inlineLinkVariants>

export function InlineLink({ className, variant = 'inline', render, ...props }: InlineLinkProps) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>({ className: cn(inlineLinkVariants({ variant }), className) }, props),
    render,
    state: {
      slot: 'inline-link',
      variant,
    },
  })
}
