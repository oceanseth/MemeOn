import { Input as BaseInput } from '@base-ui/react/input'
import type { InputProps } from '@base-ui/react/input'
import { cn } from '../lib/cn'
import type { Styled } from '@/atoms/field'

/** Shared recessed well for input, select, and textarea. `font-normal` resists Field's 600 weight. */
export const controlChrome =
  'h-field rounded-field border-0 bg-muted shadow-pressed px-control-x ' +
  'text-label font-normal text-foreground pointer-coarse:text-[length:max(16px,1em)] ' +
  'focus-visible:outline-3 focus-visible:outline-ring focus-visible:outline-offset-2 ' +
  'contrast-more:focus-visible:outline-4 forced-colors:focus-visible:outline-fc-highlight ' +
  'disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity) ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--state-disabled-opacity) ' +
  'data-[invalid]:inset-ring-2 data-[invalid]:inset-ring-destructive ' +
  'aria-invalid:inset-ring-2 aria-invalid:inset-ring-destructive'

export const placeholderChrome =
  'placeholder:font-normal placeholder:opacity-100 placeholder:text-muted-foreground'

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
