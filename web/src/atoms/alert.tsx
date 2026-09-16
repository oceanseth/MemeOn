import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

/** A tinted band that shrink-wraps its message; the status pair is the whole look. */
export const alertVariants = cva(
  [
    'inline-block max-w-[60ch] text-left px-gutter py-4 text-base',
    'contrast-more:inset-ring-1 contrast-more:inset-ring-current',
  ],
  {
    variants: {
      variant: {
        info: 'bg-info text-info-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        error: 'bg-error text-error-foreground',
      },
      size: {
        default: 'rounded-lg',
        /** a one-line message takes the field radius */
        compact: 'rounded-md',
      },
    },
    defaultVariants: { variant: 'info', size: 'default' },
  },
)

export type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>

export type AlertProps = ComponentPropsWithoutRef<'div'> & VariantProps<typeof alertVariants>

/** A live region: errors interrupt (`alert`), everything else is polite (`status`); an explicit `role` wins. */
export function Alert({ className, variant, size, role, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      data-variant={variant ?? 'info'}
      role={role ?? (variant === 'error' ? 'alert' : 'status')}
      className={cn(alertVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export function AlertTitle({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div data-slot="alert-title" className={cn('block font-semibold', className)} {...props} />
}

export function AlertDescription({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div data-slot="alert-description" className={cn('block text-base text-pretty', className)} {...props} />
  )
}

/** The action row under the message. */
export function AlertAction({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('mt-3 flex flex-wrap items-center gap-2', className)}
      {...props}
    />
  )
}

/* Transitional: the `Notice` the screens still render. `ok` and `busy` were the legacy names of
   the success and info pairs; `compact` is the compact size; the 12px top margin the old band
   carried stays here so nothing shifts until the screen waves place Alerts themselves. E1 deletes. */
export type NoticeTone = 'error' | 'ok' | 'warning' | 'busy' | 'info'

const NOTICE_VARIANT: Record<NoticeTone, AlertVariant> = {
  error: 'error',
  ok: 'success',
  warning: 'warning',
  busy: 'info',
  info: 'info',
}

export interface NoticeProps extends Omit<AlertProps, 'variant' | 'size'> {
  tone: NoticeTone
  compact?: boolean
}

export function Notice({ tone, compact = false, className, ...props }: NoticeProps) {
  return (
    <Alert
      variant={NOTICE_VARIANT[tone]}
      size={compact ? 'compact' : 'default'}
      className={cn('mt-3', className)}
      {...props}
      data-slot="notice"
      data-tone={tone}
    />
  )
}
