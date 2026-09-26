import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import type { Styled } from '@/atoms/field'
import { Icon } from '@/atoms/icon'

export function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

export function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/** Pass `container={portalAnchor(id)}` (lib/portalAnchor) to keep the dialog inside its screen. */
export function DialogPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

export function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/** The scrim: the overlay tint, a little blur, a fade on each side. */
export function DialogOverlay({ className, ...props }: Styled<DialogPrimitive.Backdrop.Props>) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-(--z-modal) bg-overlay backdrop-blur-sm',
        'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none!',
        className,
      )}
      {...props}
    />
  )
}

/**
 * `inset-0 m-auto h-fit` is how a native modal `<dialog>` centres itself; `sheet` drops it to the
 * floor under the 720px cut so an on-screen keyboard pushes the box instead of burying it.
 * `danger` is a 2px ring drawn inside the card, so the box never grows and the modal shadow
 * beneath it is untouched.
 */
export const dialogContentVariants = cva(
  cn(
    'group/dialog-content fixed inset-0 z-(--z-modal) m-auto box-border flex h-fit w-full flex-col gap-4 overflow-y-auto scrollbar-thin',
    'max-h-(--dialog-max-h)',
    'rounded-lg material-modal p-6 text-foreground',
    'outline-none focus-ring',
    'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none!',
  ),
  {
    variants: {
      size: {
        /** the confirm frame */
        sm: 'max-w-(--dialog-max-w-sm)',
        /** every other modal */
        md: 'max-w-(--dialog-max-w-md)',
        /** viewport-fitted artwork, with room for the title and close button */
        media: 'mx-4 h-(--dialog-max-h) w-auto max-w-none sm:mx-8',
      },
      variant: {
        default: '',
        danger: 'inset-ring-2 inset-ring-destructive',
      },
      sheet: {
        true: 'max-lg:mb-0 max-lg:max-w-none max-lg:rounded-b-none max-lg:pb-safe-6',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      sheet: false,
    },
  },
)

/**
 * The ✕ is a 40px neutral raised square in the card's corner — the glyph is the button. The mark
 * itself is the drawn `x`, which is held to a 10.5u span inside its 24 box precisely so it reads
 * as a mark sitting in the well rather than filling it; 22px of box puts ~10px of ink in the 40,
 * which is what the character it replaces measured. The well, the hit area and the relief are
 * unchanged — `text-base` now only sets the box's own metrics, not the glyph's size.
 */
const CLOSE_BUTTON = cn(
  'absolute top-6 right-6 inline-flex size-10 cursor-pointer items-center justify-center pointer-coarse:size-11',
  'rounded-sm material-raised p-0 text-base text-foreground',
  'transition-press press',
  'focus-ring disabled-look',
)

type DialogCloseShown = {
  /** omitted means the ✕ is shown; the accessible name is required either way */
  showCloseButton?: true
  closeLabel: string
  /** locks the ✕ while the dialog's work is in flight (a gift transfer, a mint) */
  closeDisabled?: boolean | undefined
}

type DialogCloseHidden = {
  showCloseButton: false
  /**
   * Storybook merges meta closeLabel with `showCloseButton: false`. The button is not rendered,
   * so this cannot name anything. `?: never` rejects WithoutCloseButton / Danger / Dark.
   */
  closeLabel?: string | undefined
  /** same optional lock as the shown arm, so it is not forwarded onto the popup */
  closeDisabled?: boolean | undefined
}

export type DialogContentProps = Styled<DialogPrimitive.Popup.Props> &
  VariantProps<typeof dialogContentVariants> & {
    /** where the portal renders; pair `PortalAnchor` with `portalAnchor(id)` to stay inside the screen */
    container?: DialogPrimitive.Portal.Props['container']
  } & (DialogCloseShown | DialogCloseHidden)

/**
 * Portal + overlay + popup. `initialFocus`/`finalFocus` and `role` pass straight through to the
 * popup. `aria-modal` is set because Base UI leaves it off and a screen reader that constrains
 * its cursor by it needs it on both roles.
 */
export function DialogContent({
  className,
  children,
  size,
  variant,
  sheet,
  showCloseButton = true,
  closeLabel,
  closeDisabled,
  container,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal container={container} className="contents">
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        data-size={size ?? 'md'}
        data-variant={variant ?? 'default'}
        data-close-button={showCloseButton || undefined}
        aria-modal="true"
        className={cn(dialogContentVariants({ size, variant, sheet }), className)}
        {...props}
      >
        {children}
        {showCloseButton && closeLabel != null ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            aria-label={closeLabel}
            disabled={closeDisabled}
            className={CLOSE_BUTTON}
          >
            <span aria-hidden="true">
              <Icon name="x" size={22} />
            </span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

/** Title over description; reserves the ✕'s lane when the content shows one. */
export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-1.5 text-left group-data-close-button/dialog-content:pr-12',
        className,
      )}
      {...props}
    />
  )
}

/** The action row: buttons to the end, wrapping on a narrow sheet. */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-wrap items-center justify-end gap-2.5', className)}
      {...props}
    />
  )
}

export function DialogTitle({ className, ...props }: Styled<DialogPrimitive.Title.Props>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('m-0 font-display text-3xl font-normal text-foreground text-pretty', className)}
      {...props}
    />
  )
}

/** Label scale, not body — matches every modal description in the app. */
export function DialogDescription({
  className,
  ...props
}: Styled<DialogPrimitive.Description.Props>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('m-0 text-base text-muted-foreground', className)}
      {...props}
    />
  )
}
