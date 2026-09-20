import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from '@/atoms/spinner'

/* The raised pill and its relief: `lift` deepens the shadow on a fine-pointer hover, `press` sinks
   it on active, `aria-pressed` swaps the whole material for the pressed well. Every raised variant
   composes this; ghost and link paint no material and so take no relief. */
const RAISED =
  'material-raised lift press aria-pressed:material-pressed aria-pressed:text-foreground'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'cursor-pointer select-none rounded-lg font-medium text-foreground',
    'transition-press focus-ring hit-44',
    'aria-disabled:pointer-events-none disabled-look',
  ],
  {
    variants: {
      variant: {
        /** the neutral raised pill: cancel, share, load more, a tab that is off */
        default: RAISED,
        /** the one bubblegum action per task or card */
        primary: [RAISED, 'bg-primary text-primary-foreground'],
        /** the ultraviolet companion: a second action on a card that must not spend the bubblegum */
        brand: [RAISED, 'bg-brand text-brand-foreground'],
        /** tinted, not the strong red: delete, revoke, decline */
        destructive: [RAISED, 'bg-error text-error-foreground'],
        /** the toolbar Mint: bubblegum under the shell cut, neutral once the header owns primary */
        mint: [RAISED, 'bg-primary text-primary-foreground xl:bg-accent xl:text-foreground'],
        /** no plate; a tint on hover and the pressed well when it is on */
        ghost: 'hover:bg-accent aria-pressed:material-pressed',
        /** the translucent plate a control wears over moving pictures */
        glass: [RAISED, 'glass hover:bg-accent'],
        /** a square picture button: a pressed well, the picture fills it, the ring marks the pick */
        cell: [
          'material-pressed overflow-hidden p-0',
          'aria-pressed:inset-ring-2 aria-pressed:inset-ring-primary',
        ],
        /** an inline link that shares the button's box */
        link: 'text-link underline underline-offset-3 hover:no-underline',
      },
      size: {
        /** 46px, the control height */
        default: 'h-11.5 px-4.5 text-base',
        /** 40px: a row action beside a line of copy */
        sm: 'h-10 px-3.5 text-sm',
        /** 34px chip: a mode or filter toggle; the halo makes up the pointer target */
        xs: 'h-8.5 rounded-sm px-3 text-sm',
        icon: 'size-11.5',
        'icon-sm': 'size-8.5 rounded-sm',
        /** the sign-in CTA: full width on the phone, wraps, never under the control height */
        login:
          'h-auto min-h-11.5 w-full min-w-64 max-w-full px-4.5 py-3 text-base leading-5 whitespace-normal md:w-auto',
        /** a film's centred call to action: a full-height glass pill */
        pill: 'h-auto min-h-11 rounded-full px-5 py-3 text-base font-semibold',
        /** the corner toggle over a video; the phone tucks it in tighter */
        'pill-sm': 'h-auto rounded-full px-3.5 py-2 text-sm max-md:px-3 max-md:py-2 max-md:text-xs',
        /** a mode chip: the 34px control that grows into a 44px pill on the phone */
        segment: 'h-8.5 rounded-sm px-3 text-sm max-md:h-11 max-md:rounded-full max-md:text-base',
        /** a square picture cell in a grid: the caller gives the track, the cell squares it */
        cell: 'block h-auto aspect-square w-full rounded-md',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>

export interface ButtonProps extends Omit<ButtonPrimitive.Props, 'className'> {
  variant?: ButtonVariant | null | undefined
  size?: ButtonSize | null | undefined
  /** In flight: `aria-busy`, a spinner in the host's colour, full opacity even while disabled. */
  busy?: boolean | undefined
  /** Sets `aria-pressed` and the pressed well material. */
  pressed?: boolean | undefined
  className?: string | undefined
}

/**
 * `busy` wins over disabled dimming; a spread `aria-busy` (boolean or string) is honoured when
 * `busy` is omitted, because every screen model spreads a prop bag rather than passing `busy`.
 * Base UI supplies `type="button"` for a native button and `render` for a link or span. The ref is
 * forwarded, so `<PopoverTrigger render={<Button />}>` registers the element Base UI anchors to.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, busy, pressed, className, children, ...rest },
  ref,
) {
  const isBusy = busy ?? (rest['aria-busy'] === true || rest['aria-busy'] === 'true')
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      {...rest}
      aria-busy={isBusy || undefined}
      aria-pressed={pressed ?? rest['aria-pressed']}
      className={cn(
        buttonVariants({ variant, size }),
        isBusy && 'opacity-100! cursor-progress', // beats the attribute-selector specificity of disabled-look
        className,
      )}
    >
      {isBusy && <Spinner tone="current" />}
      {children}
    </ButtonPrimitive>
  )
})

export { buttonVariants }
