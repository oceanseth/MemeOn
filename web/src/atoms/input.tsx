import { Input as BaseInput } from '@base-ui/react/input'
import type { InputProps } from '@base-ui/react/input'
import { cn } from '../lib/cn'
import type { Styled } from '@/atoms/field'

/** Shared recessed well for input, select, and textarea. `font-normal` resists Field's 600 weight. */
export const controlChrome = cn(
  'h-12.5 rounded-md material-pressed px-4.5',
  'text-label font-normal text-foreground pointer-coarse:text-[length:max(16px,1em)]',
  'focus-ring disabled-look',
  'data-invalid:inset-ring-2 data-invalid:inset-ring-destructive',
  'aria-invalid:inset-ring-2 aria-invalid:inset-ring-destructive',
)

export const placeholderChrome = cn('placeholder:font-normal placeholder:opacity-100 placeholder:text-muted-foreground')

export function Input({ className, ...props }: Styled<InputProps>) {
  return (
    <BaseInput
      className={cn(
        controlChrome,
        placeholderChrome,
        'pointer-coarse:[&[type=number]]:min-w-18',
        className,
      )}
      {...props}
      data-slot="input"
    />
  )
}
