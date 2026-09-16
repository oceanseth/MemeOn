import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import type { CheckboxRootProps } from '@base-ui/react/checkbox'
import { cva, type VariantProps } from 'class-variance-authority'
import { CheckIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Styled } from '@/atoms/field'
import { cn } from '@/lib/cn'

/** The 22px raised box; checked fills it with the action colour. `hit-44` halos it on a coarse pointer. */
const boxChrome = cn(
  'peer inline-flex size-5.5 shrink-0 items-center justify-center rounded-xs material-raised',
  'text-primary-foreground hit-44',
  'data-checked:bg-primary data-indeterminate:bg-primary',
  'data-invalid:inset-ring-2 data-invalid:inset-ring-destructive',
  'aria-invalid:inset-ring-2 aria-invalid:inset-ring-destructive',
  'focus-ring disabled-look',
)

/** The labelled row: a 44px target around box + words. `pill` is the binder's private toggle. */
export const checkboxLabelVariants = cva(
  [
    'inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-base text-foreground',
    'has-data-disabled:cursor-not-allowed has-data-disabled:opacity-(--opacity-disabled)',
  ],
  {
    variants: {
      variant: {
        default: '-ms-2 px-2 py-1',
        pill: [
          'h-11.5 rounded-lg material-raised px-4.5 font-semibold transition-press',
          'has-data-checked:material-pressed',
        ],
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type CheckboxProps = Styled<CheckboxRootProps> &
  VariantProps<typeof checkboxLabelVariants> & {
    /** With a label the row is the target and `className` styles the row; without, `className` styles the box. */
    label?: ReactNode
  }

export function Checkbox({ label, variant, className, ...props }: CheckboxProps) {
  const box = (
    <BaseCheckbox.Root
      data-slot="checkbox"
      className={label === undefined ? cn(boxChrome, className) : boxChrome}
      {...props}
    >
      <BaseCheckbox.Indicator data-slot="checkbox-indicator" className="flex">
        <CheckIcon className="size-4" />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  )
  if (label === undefined) return box
  return (
    <label
      data-slot="checkbox-label"
      data-variant={variant ?? 'default'}
      className={cn(checkboxLabelVariants({ variant }), className)}
    >
      {box}
      {label}
    </label>
  )
}
