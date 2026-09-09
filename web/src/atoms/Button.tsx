import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'default' | 'primary' | 'danger' | 'login'

const PRIMARY_BG = 'bg-[linear-gradient(135deg,var(--color-primary-from),var(--color-primary-to))]'

const BASE = cn(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap',
  'rounded-control border border-border-strong bg-bg-raised text-text',
  'px-3.5 py-2 text-base cursor-pointer',
  'pointer-coarse:min-h-11',
  '[transition:transform_var(--dur-fast)_ease,border-color_var(--dur-base)_ease,background_var(--dur-base)_ease]',
  'motion-reduce:transition-none',
  '[&:not(:disabled):hover]:border-(--state-hover-border)',
  '[@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):hover]:-translate-y-px',
  'pointer-coarse:[&:not(:disabled):active]:translate-y-px',
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring) focus-visible:outline-offset-(--focus-offset)',
  'contrast-more:focus-visible:outline-3',
  'forced-colors:focus-visible:outline-[Highlight]',
  'aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-(--state-disabled-opacity)',
)

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: '',
  primary: cn(PRIMARY_BG, 'border-transparent font-semibold'),
  danger: 'border-danger-border text-danger',
  login: cn(
    PRIMARY_BG,
    'border-transparent font-semibold whitespace-normal',
    'text-[17px] px-[26px] py-[13px] rounded-[12px] min-w-64 max-w-full',
  ),
}

/** The look react-router `<Link>`s wear to pass as `a.btn`; combine with `aria-disabled` for a locked link. */
export function buttonClasses(variant: ButtonVariant = 'default'): string {
  return cn(BASE, VARIANT_CLASSES[variant])
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  busy?: boolean
}

/** Busy always wins over the `:disabled` dimming, matching the legacy `[aria-busy]` override. */
export function Button({
  variant = 'default',
  busy = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-busy={busy || undefined}
      data-slot="button"
      className={cn(
        buttonClasses(variant),
        busy
          ? 'opacity-100 cursor-progress'
          : 'disabled:opacity-(--state-disabled-opacity) disabled:cursor-not-allowed',
        className,
      )}
    >
      {busy && <Spinner />}
      {children}
    </button>
  )
}
