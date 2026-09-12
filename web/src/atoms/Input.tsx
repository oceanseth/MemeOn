import { Input as BaseInput } from '@base-ui/react/input'
import type { InputProps } from '@base-ui/react/input'
import { cn } from '../lib/cn'
import type { Styled } from './Field'

/**
 * The recessed well every `input`, `select` and `textarea` in the app sits in: 50 tall, radius 18,
 * 18px of gutter, the pressed material on `--color-surface-pressed`, no border — the relief is the
 * edge (components.md › Inputs). `font-normal` is deliberate: preflight hands form controls
 * `font: inherit`, and a `<Field>` column is 600, which would otherwise bold every value.
 *
 * The label is 15px as the boards draw it; `pointer-coarse` raises it to the 16px iOS focus-zoom
 * floor, which is the only place that floor was ever about — a touch device, not a desktop.
 */
export const controlChrome =
  'h-[50px] rounded-field border-0 bg-surface-pressed shadow-pressed px-[18px] ' +
  'text-label font-normal text-ink pointer-coarse:text-[length:max(16px,1em)] ' +
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2 ' +
  'contrast-more:focus-visible:outline-4 forced-colors:focus-visible:outline-[color:Highlight] ' +
  'disabled:cursor-not-allowed disabled:opacity-(--state-disabled-opacity) ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-(--state-disabled-opacity) ' +
  /* invalid is a 2px ring drawn *inside* the well, so the field never grows by 2px when it fails.
     Tailwind composes `inset-ring` and `shadow` into the one `box-shadow`, so the pressed material
     survives underneath it. Base UI reports the state as `data-invalid`; a hand-wired control
     (the Create screen writes its own `aria-invalid`) gets the same ring. */
  'data-[invalid]:inset-ring-2 data-[invalid]:inset-ring-error-text ' +
  'aria-invalid:inset-ring-2 aria-invalid:inset-ring-error-text'

/** The placeholder reads as a filled value: same size, regular weight, muted ink. */
export const placeholderChrome =
  'placeholder:font-normal placeholder:opacity-100 placeholder:text-ink-muted'

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
