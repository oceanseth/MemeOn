import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Spinner } from '@/atoms/spinner'

/* The raised pill and its relief: `lift` deepens the shadow on a fine-pointer hover, `press` sinks
   it on active, `aria-pressed` swaps the whole material for the pressed well. Every raised variant
   composes this; ghost and link paint no material and so take no relief. */
const RAISED = 'material-raised lift press aria-pressed:material-pressed aria-pressed:text-foreground'

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
        /** the toolbar Mint: bubblegum under the shell cut, neutral once the sidebar owns primary */
        mint: [RAISED, 'bg-primary text-primary-foreground xl:bg-accent xl:text-foreground'],
        /** no plate; a tint on hover and the pressed well when it is on */
        ghost: 'hover:bg-accent aria-pressed:material-pressed',
        /** an inline link that shares the button's box */
        link: 'text-link underline underline-offset-3 hover:no-underline',
      },
      size: {
        /** 46px, the control height */
        default: 'h-control px-4.5 text-base',
        /** 40px: a row action beside a line of copy */
        sm: 'h-10 px-3.5 text-sm',
        /** 34px chip: a mode or filter toggle; the halo makes up the pointer target */
        xs: 'h-control-sm rounded-sm px-3 text-sm',
        icon: 'size-control',
        'icon-sm': 'size-control-sm rounded-sm',
        /** the sign-in CTA: full width on the phone, wraps, never under the control height */
        login: 'h-auto min-h-control w-full min-w-64 max-w-full px-4.5 py-3 text-base leading-5 whitespace-normal md:w-auto',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

type RegistryVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>

/** The three names the screens and models still pass; each resolves to a registry axis below. */
type LegacyButtonVariant = 'secondary' | 'danger' | 'login'

export type ButtonVariant = RegistryVariant | LegacyButtonVariant

const LEGACY: Record<LegacyButtonVariant, { variant: RegistryVariant; size?: ButtonSize }> = {
  secondary: { variant: 'brand' },
  danger: { variant: 'destructive' },
  login: { variant: 'primary', size: 'login' },
}

const isLegacy = (variant: ButtonVariant): variant is LegacyButtonVariant => variant in LEGACY

interface ResolvedVariants {
  variant: RegistryVariant
  size: ButtonSize | null | undefined
}

/** Legacy names map onto the axes; a size the caller passes beats the legacy default. */
function resolveVariants(
  variant: ButtonVariant | null | undefined,
  size: ButtonSize | null | undefined,
): ResolvedVariants {
  const named = variant ?? 'default'
  if (!isLegacy(named)) return { variant: named, size }
  const legacy = LEGACY[named]
  return { variant: legacy.variant, size: size ?? legacy.size }
}

/**
 * The classes alone, for a `<Link>`/`<a>` that wears the pill: `<Button render={<Link />}>` is
 * the registry form and replaces this at every site; combine with `aria-disabled` for a locked
 * link meanwhile.
 */
export function buttonClasses(variant: ButtonVariant = 'default', size?: ButtonSize): string {
  return cn(buttonVariants(resolveVariants(variant, size)))
}

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
 * Base UI supplies `type="button"` for a native button and `render` for a link or span.
 */
export function Button({ variant, size, busy, pressed, className, children, ...rest }: ButtonProps) {
  const isBusy = busy ?? (rest['aria-busy'] === true || rest['aria-busy'] === 'true')
  return (
    <ButtonPrimitive
      data-slot="button"
      {...rest}
      aria-busy={isBusy || undefined}
      aria-pressed={pressed ?? rest['aria-pressed']}
      className={cn(
        buttonVariants(resolveVariants(variant, size)),
        isBusy && 'opacity-100! cursor-progress', // beats the attribute-selector specificity of disabled-look
        className,
      )}
    >
      {isBusy && <Spinner tone="current" />}
      {children}
    </ButtonPrimitive>
  )
}

export { buttonVariants }
