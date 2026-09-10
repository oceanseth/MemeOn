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
  'motion-reduce:[&:not(:disabled):hover]:translate-y-0!',
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
  return cn(
    BASE,
    VARIANT_CLASSES[variant],
    /* `leading-[normal]` is the CSS keyword, not Tailwind's `leading-normal` (which is 1.5): the
       legacy rule never set a line-height, so `font: inherit` picked up the UA default off `body`.
       Preflight sets `html { line-height: 1.5 }`, so without this a button renders ~5-6px tall.
       Placed last: tailwind-merge treats `font-size` (login's `text-[17px]`) as conflicting with
       `leading` and drops whichever of the two comes first, so this must sort after it. */
    'leading-[normal]',
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  busy?: boolean
}

/**
 * Busy always wins over the `:disabled` dimming, matching the legacy `[aria-busy]` override.
 * Every real call site's prop bag is typed and spread as `{ 'aria-busy': boolean, ... }` rather
 * than `busy` (see hooks/*Screen.ts, molecules/tradeCardModel.ts), so a spread `aria-busy`
 * (boolean or the string `'true'`/`'false'`) is honoured as a fallback when `busy` isn't passed
 * explicitly — `busy` still wins when both are present.
 */
export function Button({
  variant = 'default',
  busy,
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
      data-slot="button"
      className={cn(
        buttonClasses(variant),
        isBusy
          /* `!` forces `!important` so busy always beats BASE's `aria-disabled:opacity-*` — that
             utility carries an attribute-selector specificity bump that would otherwise outrank a
             plain (non-important) `opacity-100` regardless of class order, dimming a busy-and-
             aria-disabled button (e.g. InviteScreen's join button while it submits). */
          ? 'opacity-100! cursor-progress'
          : 'disabled:opacity-(--state-disabled-opacity) disabled:cursor-not-allowed',
        className,
      )}
    >
      {isBusy && <Spinner />}
      {children}
    </button>
  )
}
