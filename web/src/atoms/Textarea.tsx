import { Field as BaseField } from '@base-ui/react/field'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../lib/cn'
import { controlChrome, placeholderChrome } from './Input'

/**
 * Base UI ships no textarea part, so `Field.Control` is rendered as one and keeps the Field wiring.
 * The well's fixed 50px height becomes a 120px floor and the gutter gains a vertical half, so the
 * first line sits where a single-line control's value would (components.md › Inputs).
 */
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
        'h-auto min-h-[120px] py-[15px] resize-y',
        className,
      )}
      data-slot="textarea"
    />
  )
}
