import { Field as BaseField } from '@base-ui/react/field'
import type { ComponentPropsWithoutRef } from 'react'
import { inputVariants } from '@/atoms/input'
import { cn } from '@/lib/cn'

/** The well as a multi-line control, wired into Field validity through `Field.Control`. */
export function Textarea({
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<'textarea'>, 'className'> & {
  className?: string | undefined
}) {
  return (
    <BaseField.Control
      render={<textarea {...props} />}
      data-slot="textarea"
      className={cn(inputVariants(), 'h-auto min-h-30 py-4 resize-y', className)}
    />
  )
}
