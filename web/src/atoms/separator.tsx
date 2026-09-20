import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import type { Styled } from '@/atoms/field'

/** A hairline in the `border` colour; vertical stretches to the row it sits in. */
export const separatorVariants = cva('shrink-0 bg-border', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'w-px self-stretch',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
})

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: Styled<SeparatorPrimitive.Props>) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(separatorVariants({ orientation }), className)}
      {...props}
    />
  )
}
