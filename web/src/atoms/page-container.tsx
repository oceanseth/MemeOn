import { cva, type VariantProps } from 'class-variance-authority'
import { createElement, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** Route content box; the measure comes from the shell column, the gutter never sits under a notch. */
const pageContainerVariants = cva('mx-auto w-full pt-0 pb-16 px-page-safe', {
  variants: {
    width: {
      full: '',
      /** prose routes (Developers, legal) */
      narrow: 'max-w-190',
    },
  },
  defaultVariants: { width: 'full' },
})

export interface PageContainerProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof pageContainerVariants> {
  as?: 'div' | 'main' | 'section'
}

export function PageContainer({ as = 'div', width, className, ...rest }: PageContainerProps) {
  return createElement(as, {
    ...rest,
    'data-slot': 'page-container',
    className: cn(pageContainerVariants({ width }), className),
  })
}

export { pageContainerVariants }
