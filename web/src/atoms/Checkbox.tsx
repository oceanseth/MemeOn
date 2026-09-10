import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import type { CheckboxRootProps } from '@base-ui/react/checkbox'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import type { Styled } from './Field'

/** The label row: the whole 44px line is the target, pulled back 8px so the box still aligns. */
export const checkboxLabelChrome =
  'inline-flex min-h-11 -ms-2 cursor-pointer items-center gap-2 px-2 py-1 text-sm leading-normal ' +
  'has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-(--state-disabled-opacity)'

/** The 20px box the browser used to paint from `accent-color`. */
export const checkboxBoxChrome =
  'inline-flex size-5 shrink-0 items-center justify-center rounded-[3px] border border-border-strong bg-bg-raised text-bg ' +
  'data-[checked]:border-accent data-[checked]:bg-accent ' +
  'data-[indeterminate]:border-accent data-[indeterminate]:bg-accent ' +
  'data-[invalid]:border-danger-border ' +
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset) ' +
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[color:Highlight]'

function CheckGlyph() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 16 16" fill="none">
      <path
        d="m3.25 8.25 3.25 3.25 6-6.75"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
        <BaseCheckbox.Indicator className="flex">
          <CheckGlyph />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {label}
    </label>
  )
}
