import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import type { CheckboxRootProps } from '@base-ui/react/checkbox'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import type { Styled } from './Field'

/** The label row: the whole 44px line is the target, pulled back 8px so the box still aligns. */
export const checkboxLabelChrome =
  'inline-flex min-h-11 -ms-2 cursor-pointer items-center gap-2.5 px-2 py-1 text-label text-ink ' +
  'has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-(--state-disabled-opacity)'

/**
 * The 22px raised well the browser used to paint from `accent-color`; checked fills with the one
 * action colour and the mark is the ✓ text glyph in the action's own ink (the design draws no
 * check icon, and the Central set WP0 extracted has none).
 */
export const checkboxBoxChrome =
  'inline-flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border-0 ' +
  'bg-surface-raised shadow-raised text-caption leading-none text-transparent ' +
  'data-[checked]:bg-action data-[checked]:text-on-action ' +
  'data-[indeterminate]:bg-action data-[indeterminate]:text-on-action ' +
  'data-[invalid]:inset-ring-2 data-[invalid]:inset-ring-error-text ' +
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2 ' +
  'contrast-more:focus-visible:outline-4 forced-colors:focus-visible:outline-[color:Highlight]'

export function Checkbox({
  label,
  className,
  boxClassName,
  ...props
}: Styled<CheckboxRootProps> & {
  label: ReactNode
  boxClassName?: string | undefined
}) {
  return (
    <label className={cn(checkboxLabelChrome, className)} data-slot="checkbox">
      <BaseCheckbox.Root className={cn(checkboxBoxChrome, boxClassName)} {...props}>
        <BaseCheckbox.Indicator className="flex" aria-hidden="true">
          ✓
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {label}
    </label>
  )
}
