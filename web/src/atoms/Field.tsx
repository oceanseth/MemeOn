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

export const labelChrome = 'text-sm leading-normal font-semibold text-text-dim'

/** `.field-hint` / `.field-help`, at the regular weight the screens render it in today. */
export const hintChrome = 'mt-1 block text-xs leading-normal font-normal text-text-dim'

export const errorChrome = 'mt-1 block text-xs leading-normal font-normal text-danger'

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

/**
 * The standalone shape: most `.field-hint` / `.field-help` in the app is loose caption text with no
 * label and no control, and Base UI's `Field.Description` throws outside a `<Field>`. These carry the
 * same look with no context, and take an `id` so a call site can wire `aria-describedby` by hand.
 * `as="span"` is for the sites that sit inside a bare `<label>`, where a `<p>` would be invalid.
 */
export type TextProps = ComponentPropsWithoutRef<'p'> & { as?: 'p' | 'span' | undefined }

export function Hint({ as: Tag = 'p', className, ...props }: TextProps) {
  return <Tag className={cn(hintChrome, className)} {...props} data-slot="hint" />
}

export function ErrorText({ as: Tag = 'p', className, ...props }: TextProps) {
  return <Tag className={cn(errorChrome, className)} {...props} data-slot="error-text" />
}

/**
 * `.field-counter` floated right, so the help text kept the same line and wrapped around it. In a
 * flex column that float is inert, so the pair gets an explicit row instead. `[&>*]:mt-0` drops the
 * children's own top margin — the row owns the 4px gap once, not once per child.
 */
export function FieldFooter({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('mt-1 flex items-baseline justify-between gap-2 [&>*]:mt-0', className)}
      {...props}
      data-slot="field-footer"
    />
  )
}

/** Belongs in a `FieldFooter`; `ml-auto` keeps it right-aligned even when it is the only child. */
export function FieldCounter({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn(
        'ml-auto shrink-0 text-xs leading-normal font-normal text-text-dim tabular-nums',
        className,
      )}
      {...props}
      data-slot="field-counter"
    />
  )
}
