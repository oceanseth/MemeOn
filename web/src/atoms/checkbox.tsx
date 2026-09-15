import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import type { CheckboxRootProps } from '@base-ui/react/checkbox'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import type { Styled } from '@/atoms/field'

export const checkboxLabelChrome =
  'inline-flex min-h-11 -ms-2 cursor-pointer items-center gap-2.5 px-2 py-1 text-label text-foreground ' +
  'has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-(--state-disabled-opacity)'

export const checkboxBoxChrome =
  'inline-flex size-icon shrink-0 items-center justify-center rounded-[7px] border-0 ' +
  'bg-accent shadow-raised text-caption leading-none text-transparent ' +
  'data-[checked]:bg-primary data-[checked]:text-primary-foreground ' +
  'data-[indeterminate]:bg-primary data-[indeterminate]:text-primary-foreground ' +
  'data-[invalid]:inset-ring-2 data-[invalid]:inset-ring-destructive ' +
  'focus-visible:outline-3 focus-visible:outline-ring focus-visible:outline-offset-2 ' +
  'contrast-more:focus-visible:outline-4 forced-colors:focus-visible:outline-fc-highlight'

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
