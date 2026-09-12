import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { Spinner } from './Spinner'

/**
 * `default` is the neutral raised pill, `primary` the one bubblegum (sky in dark) action a task or
 * card is allowed, `secondary` the ultraviolet companion, `danger` the error-surface destructive,
 * and `login` the wide primary the public pages use. Toggles and tabs wear `pressed` instead of a
 * variant: the pressed material is a state, not a sixth look.
 */
export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger' | 'login'

const BASE = cn(
  'inline-flex items-center justify-center gap-[9px] whitespace-nowrap cursor-pointer',
  // 46 tall, radius 23, padding-inline 18, Onest 15/18 600 — components.md › Buttons
  'h-[46px] rounded-control px-[18px] text-label font-semibold',
  // the material: no border anywhere in Soft Press, the relief is the edge
  'border-0 bg-surface-raised text-ink shadow-raised',
  '[transition:transform_var(--dur-fast)_ease,box-shadow_var(--dur-base)_ease,background-color_var(--dur-base)_ease]',
  'motion-reduce:transition-none',
  /* the raised relief one step deeper (0 3px 5px → 0 4px 7px). Scoped off `:active` and off a
     pressed toggle so only one of the three materials can ever match: hover, active and
     `aria-pressed` all write `box-shadow`, and the cascade would otherwise pick the winner by
     stylesheet order rather than by what the finger is doing. */
  '[&:not(:disabled):not([aria-pressed=true]):hover:not(:active)]:shadow-[var(--color-highlight)_0_1px_1px_inset,var(--color-shadow)_0_-1px_1px_inset,var(--color-shadow)_0_4px_7px]',
  '[@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-pressed=true]):hover:not(:active)]:-translate-y-px',
  'motion-reduce:[&:not(:disabled):not([aria-pressed=true]):hover:not(:active)]:translate-y-0!',
  '[&:not(:disabled):active]:translate-y-px [&:not(:disabled):active]:shadow-pressed',
  // the design's ring: 3px focus, 2px offset (the base rule says the same; this states it locally)
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'contrast-more:focus-visible:outline-4',
  'forced-colors:focus-visible:outline-[Highlight]',
  // a toggle or tab that is on: the pressed well, whether it came from the prop or a spread
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
    /* the public CTA: the phone's full 350px column, a 256px floor on desktop. It is the one
       button allowed to wrap, so its height grows from the label instead of being pinned. */
    'w-full min-w-64 max-w-full md:w-auto',
    'h-auto min-h-[46px] px-[26px] py-[13px] whitespace-normal',
    /* …which means the line box has to be pinned instead, or an emoji in the label (🎭 on both
       landing CTAs) grows it past the board's 46 (`DRU-0`, `DUC-0`): 13 + 20 + 13. Spelled as the
       same arbitrary property as the base below so tailwind-merge replaces it rather than emitting
       two line-heights and letting stylesheet order decide. */
    '[line-height:20px]',
  ),
}

/** The look react-router `<Link>`s wear to pass as a button; combine with `aria-disabled` for a locked link. */
export function buttonClasses(variant: ButtonVariant = 'default'): string {
  return cn(
    BASE,
    /* The CSS keyword `normal`, not Tailwind's `leading-normal` (a fixed 1.5): a button's label
       sits on its own line box inside the 46px pill, and preflight's `html { line-height: 1.5 }`
       would push a wrapping `login` label apart.
       Spelled as an arbitrary *property* rather than `leading-[normal]` on purpose: tailwind-merge
       puts `font-size` and `leading` in one conflict group, so a caller's own `text-*` — the
       Marketplace "Clear filters" chip is `text-xs` — silently deletes a `leading-*` that sorts
       before it. The arbitrary-property group has no such conflict, so this survives any `text-*`
       and is still overridable by another `[line-height:…]` — which is how `login` pins its own,
       and how `AlertsBell` buys its taller emoji row. Covered by `lib/cn.test.ts`. */
    '[line-height:normal]',
    VARIANT_CLASSES[variant],
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  busy?: boolean
  /**
   * A toggle/tab that is on: sets `aria-pressed` and swaps the raised material for the pressed
   * well. A spread `aria-pressed` (the filter rows build their props as a bag) styles the same way.
   */
  pressed?: boolean
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
          /* `!` forces `!important` so busy always beats BASE's `aria-disabled:opacity-*` — that
             utility carries an attribute-selector specificity bump that would otherwise outrank a
             plain (non-important) `opacity-100` regardless of class order, dimming a busy-and-
             aria-disabled button (e.g. InviteScreen's join button while it submits). */
          ? 'opacity-100! cursor-progress'
          : 'disabled:opacity-(--state-disabled-opacity) disabled:cursor-not-allowed',
        className,
      )}
    >
      {/* the ring reads as the label's own colour, so it stays visible on bubblegum, sky and ultraviolet */}
      {isBusy && <Spinner className="border-current/30 border-t-current" />}
      {children}
    </button>
  )
}
