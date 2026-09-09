import { Field as BaseField } from '@base-ui/react/field'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../lib/cn'
import { controlChrome, placeholderChrome } from './Input'

/** Base UI ships no textarea part, so `Field.Control` is rendered as one and keeps the Field wiring. */
export function Textarea({
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<'textarea'>, 'className'> & { className?: string | undefined }) {
  return (
    <BaseField.Control
      render={<textarea {...props} />}
      className={cn(controlChrome, placeholderChrome, 'resize-y', className)}
      data-slot="textarea"
    />
  )
}
