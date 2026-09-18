import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * The display ladder, Unbounded at its one weight, one tracking per size. `display` and
 * `section` take their phone step under the 641px cut; `card-title` and `card-title-phone` are
 * fixed. The element (`as`) is the outline level; the size is the look — the two are independent,
 * so a screen can promote a title to `<h1>` without changing its type.
 */
export const headingVariants = cva('m-0 font-display font-normal text-foreground text-balance', {
  variants: {
    size: {
      display: 'text-5xl max-md:text-4xl',
      section: 'text-4xl max-md:text-2xl',
      title: 'text-3xl',
      /** a title whose trailing count must keep its line on a phone */
      'title-phone': 'text-3xl max-md:text-2xl',
      'card-title': 'text-2xl',
      'card-title-phone': 'font-sans text-lg font-semibold',
    },
  },
  defaultVariants: {
    size: 'title',
  },
})

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4'

export interface HeadingProps extends ComponentProps<'h2'>, VariantProps<typeof headingVariants> {
  /** @default 'h2' */
  as?: HeadingLevel | undefined
}

/** The ref reaches the element: a screen that focuses its outcome heading passes one. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { as: Tag = 'h2', size, className, ...props },
  ref,
) {
  return (
    <Tag
      ref={ref}
      data-slot="heading"
      data-size={size ?? 'title'}
      className={cn(headingVariants({ size }), className)}
      {...props}
    />
  )
})
