import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Button, type ButtonProps } from '@/atoms/button'
import type { Styled } from '@/atoms/field'

export function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

export function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

/** Pass `container={portalAnchor(id)}` (lib/portalAnchor) to keep the dialog inside its screen. */
export function AlertDialogPortal(props: AlertDialogPrimitive.Portal.Props) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
}

export function AlertDialogOverlay({
  className,
  ...props
}: Styled<AlertDialogPrimitive.Backdrop.Props>) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
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
 * The confirm frame: 440px by default, centred like a native `<dialog>`, a bottom sheet under the
 * 720px cut when `sheet` is set, and a 2px destructive ring inside the card for `danger`.
 */
export const alertDialogContentVariants = cva(
  cn(
    'group/alert-dialog-content fixed inset-0 z-(--z-modal) m-auto box-border flex h-fit w-full flex-col gap-4 overflow-y-auto scrollbar-thin',
    'max-h-[min(86dvh,86vh)]',
    'rounded-lg material-modal p-6 text-foreground',
    'outline-none focus-ring',
    'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none!',
  ),
  {
    variants: {
      size: {
        sm: 'max-w-[min(440px,calc(100vw-24px))]',
        md: 'max-w-[min(640px,calc(100vw-24px))]',
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
      size: 'sm',
      variant: 'default',
      sheet: false,
    },
  },
)

export interface AlertDialogContentProps
  extends Styled<AlertDialogPrimitive.Popup.Props>,
    VariantProps<typeof alertDialogContentVariants> {
  /** where the portal renders; pair `PortalAnchor` with `portalAnchor(id)` to stay inside the screen */
  container?: AlertDialogPrimitive.Portal.Props['container']
}

/** Portal + overlay + popup. Base UI sets `role="alertdialog"`; `aria-modal` is added because it does not. */
export function AlertDialogContent({
  className,
  size,
  variant,
  sheet,
  container,
  ...props
}: AlertDialogContentProps) {
  return (
    <AlertDialogPortal container={container} className="contents">
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-size={size ?? 'sm'}
        data-variant={variant ?? 'default'}
        aria-modal="true"
        className={cn(alertDialogContentVariants({ size, variant, sheet }), className)}
        {...props}
      />
    </AlertDialogPortal>
  )
}

export function AlertDialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-1.5 text-left', className)}
      {...props}
    />
  )
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('flex flex-wrap items-center justify-end gap-2.5', className)}
      {...props}
    />
  )
}

/** A glyph in a 40px well above the title. */
export function AlertDialogMedia({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-md material-pressed text-xl leading-none',
        className,
      )}
      {...props}
    />
  )
}

export function AlertDialogTitle({
  className,
  ...props
}: Styled<AlertDialogPrimitive.Title.Props>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('m-0 font-display text-3xl font-normal text-foreground text-pretty', className)}
      {...props}
    />
  )
}

export function AlertDialogDescription({
  className,
  ...props
}: Styled<AlertDialogPrimitive.Description.Props>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('m-0 text-base text-muted-foreground', className)}
      {...props}
    />
  )
}

/** The commit: a `Button`; the caller closes the dialog when its work is done. */
export function AlertDialogAction(props: ButtonProps) {
  return <Button data-slot="alert-dialog-action" {...props} />
}

export type AlertDialogCancelProps = Styled<AlertDialogPrimitive.Close.Props> &
  Pick<ButtonProps, 'variant' | 'size'>

/** The way out: Base UI's Close rendered as the Button pill (the registry form). */
export function AlertDialogCancel({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: AlertDialogCancelProps) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}
