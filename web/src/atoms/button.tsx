import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { Spinner } from '@/atoms/spinner'

/** Raised pill variants; toggles use `pressed`, not a sixth variant. */
export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger' | 'login'

const BASE = cn(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer',
  'h-control rounded-lg px-4.5 text-label font-semibold',
  'material-raised text-foreground',
  'transition-press',
  /* lift deepens the raised relief on hover; press sinks it on active; aria-pressed is the pressed material */
  'lift press',
  'focus-ring',
  'aria-pressed:material-pressed aria-pressed:text-foreground',
  'aria-disabled:pointer-events-none disabled-look',
)

const PRIMARY = 'bg-primary text-primary-foreground'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: '',
  primary: PRIMARY,
  secondary: 'bg-brand text-brand-foreground',
  danger: 'bg-error text-error-foreground',
  login: cn(
    PRIMARY,
    'w-full min-w-64 max-w-full md:w-auto',
    'h-auto min-h-control px-4.5 py-3.25 whitespace-normal',
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
          : 'disabled-look',
        className,
      )}
    >
      {isBusy && <Spinner className="border-current/30 border-t-current" />}
      {children}
    </button>
  )
}
