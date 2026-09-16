import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * The display ladder, Unbounded at its one weight, one tracking per size. `display` and
 * `section` take their phone step under the 641px cut; `card-title` and `card-title-phone` are
 * fixed. The element (`as`) is the outline level; the size is the look — the two are independent,
 * so a screen can promote a title to `<h1>` without changing its type.
 */
export const headingVariants = cva('m-0 font-display font-medium text-foreground text-pretty', {
  variants: {
    size: {
      display: 'text-display tracking-display max-md:text-display-phone',
      section: 'text-section tracking-title max-md:text-section-phone',
      title: 'text-title tracking-title',
      'card-title': 'text-card-title tracking-card-title',
      'card-title-phone': 'text-card-title-phone tracking-card-title',
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

export function Heading({ as: Tag = 'h2', size, className, ...props }: HeadingProps) {
  return (
    <Tag
      data-slot="heading"
      data-size={size ?? 'title'}
      className={cn(headingVariants({ size }), className)}
      {...props}
    />
  )
}
