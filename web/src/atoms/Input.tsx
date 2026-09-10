import { Input as BaseInput } from '@base-ui/react/input'
import type { InputProps } from '@base-ui/react/input'
import { cn } from '../lib/cn'
import type { Styled } from './Field'

/**
 * The shared control chrome — every `input`, `select` and `textarea` in the app wears this — plus
 * the authored `:focus-visible` ring and the coarse-pointer target floor. `max(16px, 1em)` is the
 * iOS zoom floor: label typography never shrinks a control below the size that stops focus-zoom.
 */
export const controlChrome =
  'rounded-control border border-border-strong bg-bg-raised px-3 py-2 text-[length:max(16px,1em)] leading-[1.3] text-text ' +
  'focus:border-accent ' +
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset) ' +
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[color:Highlight] ' +
  'disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity) ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--state-disabled-opacity) ' +
  'data-[invalid]:border-danger-border data-[invalid]:bg-(--state-error-bg) ' +
  'pointer-coarse:min-h-11'

/** The placeholder reads as a filled value: same size, regular weight, dimmed against the control fill. */
export const placeholderChrome =
  'placeholder:font-normal placeholder:opacity-100 ' +
  'placeholder:text-[color-mix(in_oklab,var(--color-text-dim)_80%,var(--color-bg-raised))]'

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
