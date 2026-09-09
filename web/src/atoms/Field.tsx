import { Field as BaseField } from '@base-ui/react/field'
import type {
  FieldDescriptionProps,
  FieldErrorProps,
  FieldLabelProps,
  FieldRootProps,
} from '@base-ui/react/field'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../lib/cn'

/** Base UI also accepts a state callback for `className`; narrowing to a string lets `cn()` merge it. */
export type Styled<P> = Omit<P, 'className'> & { className?: string | undefined }

/**
 * The `.field-label` box: a column that carries the label typography, so the control inside
 * inherits weight 600 through the preflight `font: inherit` exactly as the legacy label did.
 */
export function Field({ className, ...props }: Styled<FieldRootProps>) {
  return (
    <BaseField.Root
      className={cn(
        'flex flex-col gap-1.5 text-sm leading-normal font-semibold text-text-dim',
        className,
      )}
      {...props}
      data-slot="field"
    />
  )
}

export function FieldLabel({ className, ...props }: Styled<FieldLabelProps>) {
  return (
    <BaseField.Label
      className={cn('text-sm leading-normal font-semibold text-text-dim', className)}
      {...props}
      data-slot="field-label"
    />
  )
}

/** `.field-hint` / `.field-help`, at the regular weight the screens render it in today. */
export function FieldHint({ className, ...props }: Styled<FieldDescriptionProps>) {
  return (
    <BaseField.Description
      className={cn('mt-1 block text-xs leading-normal font-normal text-text-dim', className)}
      {...props}
      data-slot="field-hint"
    />
  )
}

export function FieldError({ className, ...props }: Styled<FieldErrorProps>) {
  return (
    <BaseField.Error
      className={cn('mt-1 block text-xs leading-normal font-normal text-danger', className)}
      {...props}
      data-slot="field-error"
    />
  )
}

/** `.field-counter`: the legacy float becomes a right-aligned row inside the field column. */
export function FieldCounter({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn(
        'self-end text-xs leading-normal font-normal text-text-dim tabular-nums',
        className,
      )}
      {...props}
      data-slot="field-counter"
    />
  )
}
