import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import type { Styled } from '@/atoms/field'

/**
 * A two-state control. Pressed is a material change, never an accent colour: the raised pill sinks
 * into the pressed well (`default`), a bare glyph sinks into the well (`ghost`), or a transparent
 * segment inside a well rises (`segment`, the ThemeControl look — the group paints the well).
 *
 * `size` is declared ahead of `variant` on purpose: cva emits the axes in declaration order and
 * `cn` lets the later class win, so a variant that owns its own geometry (`segment`: radius,
 * inset, type step) overrides the size step it sits in.
 */
export const toggleVariants = cva(
  cn(
    'group/toggle inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap select-none',
    'text-foreground transition-press',
    'focus-ring disabled-look',
  ),
  {
    variants: {
      size: {
        default: 'h-11.5 rounded-lg px-4.5 text-base',
        sm: 'h-8.5 rounded-sm px-3 text-sm hit-44',
        /** the SortChips row: a 46px pill, 40 on the phone, still 44 of target on a coarse pointer */
        chip: 'h-11.5 rounded-full px-4 text-base max-sm:h-10 pointer-coarse:min-h-11',
        /** the 34px square, an emoji for a label */
        icon: 'size-8.5 rounded-sm p-0 text-base leading-none hit-44',
      },
      variant: {
        default: cn('material-raised font-semibold', 'lift press', 'data-pressed:material-pressed'),
        ghost: cn(
          'bg-transparent font-medium text-muted-foreground',
          'hover:bg-accent hover:text-foreground',
          'data-pressed:material-pressed data-pressed:text-foreground',
        ),
        segment: cn(
          'min-w-0 flex-1 rounded-md bg-transparent px-1 text-xs font-semibold text-muted-foreground',
          'hover:text-foreground',
          'data-pressed:material-raised data-pressed:font-semibold data-pressed:text-foreground',
        ),
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  },
)

export type ToggleProps<Value extends string = string> = Styled<TogglePrimitive.Props<Value>> &
  VariantProps<typeof toggleVariants>

export function Toggle<Value extends string = string>({
  className,
  variant,
  size,
  ...props
}: ToggleProps<Value>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      data-variant={variant ?? 'default'}
      data-size={size ?? 'default'}
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  )
}
