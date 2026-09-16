import { Field as BaseField } from '@base-ui/react/field'
import type {
  FieldDescriptionProps,
  FieldErrorProps,
  FieldLabelProps,
  FieldRootProps,
} from '@base-ui/react/field'
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset'
import type { FieldsetLegendProps, FieldsetRootProps } from '@base-ui/react/fieldset'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'
import { labelVariants } from '@/atoms/label'
import { cn } from '@/lib/cn'

/** Base UI takes `className` as a string or a state function; the parts here take the string. */
export type Styled<P> = Omit<P, 'className'> & { className?: string | undefined }

/** Label, control, description and error wired together by Base UI (`for`, `aria-describedby`, `data-invalid`). */
export function Field({ className, ...props }: Styled<FieldRootProps>) {
  return (
    <BaseField.Root
      data-slot="field"
      className={cn('flex flex-col gap-1.5 text-small font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function FieldLabel({ className, ...props }: Styled<FieldLabelProps>) {
  return (
    <BaseField.Label
      data-slot="field-label"
      className={cn(labelVariants(), className)}
      {...props}
    />
  )
}

const descriptionChrome = 'mt-1 block text-caption font-normal text-muted-foreground'

export function FieldDescription({ className, ...props }: Styled<FieldDescriptionProps>) {
  return (
    <BaseField.Description
      data-slot="field-description"
      className={cn(descriptionChrome, className)}
      {...props}
    />
  )
}

/** Renders only while the field is invalid (`match`); Base UI describes the control with it. */
export function FieldError({ className, ...props }: Styled<FieldErrorProps>) {
  return (
    <BaseField.Error
      data-slot="field-error"
      className={cn('mt-1 block text-caption font-normal text-destructive', className)}
      {...props}
    />
  )
}

/** Standalone description outside a `<Field>`; `as="span"` for use inside a bare `<label>`. */
export type TextProps = ComponentPropsWithoutRef<'p'> & { as?: 'p' | 'span' | undefined }

export function Hint({ as: Tag = 'p', className, ...props }: TextProps) {
  return <Tag data-slot="hint" className={cn(descriptionChrome, className)} {...props} />
}

/** Description + counter on one row. */
export function FieldFooter({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="field-footer"
      className={cn('mt-1 flex items-baseline justify-between gap-2 *:mt-0', className)}
      {...props}
    />
  )
}

export function FieldCounter({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      data-slot="field-counter"
      className={cn('ml-auto shrink-0 text-caption font-normal text-muted-foreground tabular-nums', className)}
      {...props}
    />
  )
}

/** A group of fields with no chrome of its own; `min-w-0` keeps it from stretching a grid. */
export function FieldSet({ className, ...props }: Styled<FieldsetRootProps>) {
  return <BaseFieldset.Root data-slot="field-set" className={cn('min-w-0', className)} {...props} />
}

/** `legend` is the composer's intro-size heading; `label` is the micro-caps eyebrow. */
export const fieldLegendVariants = cva('p-0', {
  variants: {
    variant: {
      legend: 'mb-2.5 text-intro font-semibold text-foreground',
      label: 'mb-2 text-micro font-bold tracking-wider text-muted-foreground uppercase',
    },
  },
  defaultVariants: { variant: 'legend' },
})

export function FieldLegend({
  className,
  variant,
  ...props
}: Styled<FieldsetLegendProps> & VariantProps<typeof fieldLegendVariants>) {
  return (
    <BaseFieldset.Legend
      data-slot="field-legend"
      data-variant={variant ?? 'legend'}
      className={cn(fieldLegendVariants({ variant }), className)}
      {...props}
    />
  )
}

/* Transitional names for the screens still on `atoms/fieldset` (TradesScreen reads
   `data-slot="fieldset"` in its grid). The screen wave switches them; E1 deletes these. */
export function Fieldset({ className, ...props }: Styled<FieldsetRootProps>) {
  return <FieldSet className={className} {...props} data-slot="fieldset" />
}

export function FieldsetLegend({ className, ...props }: Styled<FieldsetLegendProps>) {
  return <FieldLegend variant="label" className={className} {...props} data-slot="fieldset-legend" />
}

export { FieldDescription as FieldHint }
