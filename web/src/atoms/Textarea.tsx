import { Field as BaseField } from '@base-ui/react/field'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../lib/cn'
import { controlChrome, placeholderChrome } from './Input'

/** Base UI textarea via `Field.Control`; 120px min-height with vertical padding. */
export function Textarea({
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<'textarea'>, 'className'> & { className?: string | undefined }) {
  return (
    <BaseField.Control
      render={<textarea {...props} />}
      className={cn(
        controlChrome,
        placeholderChrome,
        'h-auto min-h-30 py-3.75 resize-y',
        className,
      )}
      data-slot="textarea"
    />
  )
}
