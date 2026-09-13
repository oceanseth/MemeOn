import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { Spinner } from './Spinner'

/** Raised pill variants; toggles use `pressed`, not a sixth variant. */
export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger' | 'login'

const BASE = cn(
  'inline-flex items-center justify-center gap-control-gap whitespace-nowrap cursor-pointer',
  'h-control rounded-control px-control-x text-label font-semibold',
  'border-0 bg-surface-raised text-ink shadow-raised',
  '[transition:transform_var(--dur-fast)_ease,box-shadow_var(--dur-base)_ease,background-color_var(--dur-base)_ease]',
  'motion-reduce:transition-none',
  /* hover, active and aria-pressed all write box-shadow — scope each so cascade order never picks the winner */
  '[&:not(:disabled):not([aria-pressed=true]):hover:not(:active)]:shadow-[var(--color-highlight)_0_1px_1px_inset,var(--color-shadow)_0_-1px_1px_inset,var(--color-shadow)_0_4px_7px]',
  '[@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-pressed=true]):hover:not(:active)]:-translate-y-px',
  'motion-reduce:[&:not(:disabled):not([aria-pressed=true]):hover:not(:active)]:translate-y-0!',
  '[&:not(:disabled):active]:translate-y-px [&:not(:disabled):active]:shadow-pressed',
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'contrast-more:focus-visible:outline-4',
  'forced-colors:focus-visible:outline-[Highlight]',
  'aria-pressed:bg-surface-pressed aria-pressed:text-ink aria-pressed:shadow-pressed',
  'aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-(--state-disabled-opacity)',
)

const PRIMARY = 'bg-action text-on-action'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: '',
  primary: PRIMARY,
  secondary: 'bg-action-secondary text-on-action-secondary',
  danger: 'bg-error-surface text-error-text',
  login: cn(
    PRIMARY,
    'w-full min-w-64 max-w-full md:w-auto',
    'h-auto min-h-control px-6.5 py-3.25 whitespace-normal',
    '[line-height:20px]', // login wraps; pin row height so emoji labels stay 46px tall
  ),
}

/** Link styling; combine with `aria-disabled` for a locked link. */
export function buttonClasses(variant: ButtonVariant = 'default'): string {
  return cn(
    BASE,
    '[line-height:normal]', // arbitrary property — survives caller text-*; see lib/cn.test.ts
    VARIANT_CLASSES[variant],
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  busy?: boolean
  /** Sets `aria-pressed` and the pressed well material. */
  pressed?: boolean
}

/** `busy` wins over disabled dimming; spread `aria-busy` is honoured when `busy` is omitted. */
export function Button({
  variant = 'default',
  busy,
  pressed,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const isBusy = busy ?? (rest['aria-busy'] === true || rest['aria-busy'] === 'true')
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-busy={isBusy || undefined}
      aria-pressed={pressed ?? rest['aria-pressed']}
      data-slot="button"
      className={cn(
        buttonClasses(variant),
        isBusy
          ? 'opacity-100! cursor-progress' // beats aria-disabled opacity specificity
          : 'disabled:opacity-(--state-disabled-opacity) disabled:cursor-not-allowed',
        className,
      )}
    >
      {isBusy && <Spinner className="border-current/30 border-t-current" />}
      {children}
    </button>
  )
}
