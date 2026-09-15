import { Field as BaseField } from '@base-ui/react/field'
import type {
  FieldDescriptionProps,
  FieldErrorProps,
  FieldLabelProps,
  FieldRootProps,
} from '@base-ui/react/field'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../lib/cn'

export type Styled<P> = Omit<P, 'className'> & { className?: string | undefined }

export function Field({ className, ...props }: Styled<FieldRootProps>) {
  return (
    <BaseField.Root
      className={cn(
        'flex flex-col gap-1.5 text-small font-semibold text-ink',
        className,
      )}
      {...props}
      data-slot="field"
    />
  )
}

export const labelChrome = 'text-small font-semibold text-ink'

export const hintChrome = 'mt-1 block text-caption font-normal text-ink-muted'

export const errorChrome = 'mt-1 block text-caption font-normal text-error-text'

export function FieldLabel({ className, ...props }: Styled<FieldLabelProps>) {
  return (
    <BaseField.Label className={cn(labelChrome, className)} {...props} data-slot="field-label" />
  )
}

export function FieldHint({ className, ...props }: Styled<FieldDescriptionProps>) {
  return (
    <BaseField.Description className={cn(hintChrome, className)} {...props} data-slot="field-hint" />
  )
}

export function FieldError({ className, ...props }: Styled<FieldErrorProps>) {
  return (
    <BaseField.Error className={cn(errorChrome, className)} {...props} data-slot="field-error" />
  )
}

/** Standalone hint/error outside a `<Field>`; `as="span"` for use inside `<label>`. */
export type TextProps = ComponentPropsWithoutRef<'p'> & { as?: 'p' | 'span' | undefined }

export function Hint({ as: Tag = 'p', className, ...props }: TextProps) {
  return <Tag className={cn(hintChrome, className)} {...props} data-slot="hint" />
}

export function ErrorText({ as: Tag = 'p', className, ...props }: TextProps) {
  return <Tag className={cn(errorChrome, className)} {...props} data-slot="error-text" />
}

/** Caption + counter on one row. */
export function FieldFooter({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('mt-1 flex items-baseline justify-between gap-2 [&>*]:mt-0', className)}
      {...props}
      data-slot="field-footer"
    />
  )
}

export function FieldCounter({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn(
        'ml-auto shrink-0 text-caption font-normal text-ink-muted tabular-nums',
        className,
      )}
      {...props}
      data-slot="field-counter"
    />
  )
}
