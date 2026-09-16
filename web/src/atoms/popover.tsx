import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import type { Styled } from '@/atoms/field'

export function Popover(props: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

export function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

/** Pass `container={portalAnchor(id)}` (lib/portalAnchor) to keep the popup inside its screen. */
export function PopoverPortal(props: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot="popover-portal" {...props} />
}

/** Above the docked bars and the header; its own stacking context so the popup's z is local. */
const POSITIONER = 'isolate z-(--z-modal)'

export function PopoverPositioner({ className, ...props }: Styled<PopoverPrimitive.Positioner.Props>) {
  return (
    <PopoverPrimitive.Positioner
      data-slot="popover-positioner"
      className={cn(POSITIONER, className)}
      {...props}
    />
  )
}

/** The popup is a raised card of the pop material; it enters from the side it is placed on. */
const POPUP = cn(
  'flex w-72 origin-(--transform-origin) flex-col gap-2 rounded-lg material-pop p-2.5 text-base text-foreground',
  'max-h-(--available-height) overflow-y-auto scrollbar-thin',
  'outline-none focus-ring',
  'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none!',
  'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
  'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
  'data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2',
)

type PositionerPassthrough = Pick<
  PopoverPrimitive.Positioner.Props,
  'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding' | 'collisionAvoidance' | 'anchor'
>

export interface PopoverContentProps extends Styled<PopoverPrimitive.Popup.Props>, PositionerPassthrough {
  /** where the portal renders; pair `PortalAnchor` with `portalAnchor(id)` to stay inside the screen */
  container?: PopoverPrimitive.Portal.Props['container']
  /** the positioner's own classes — the one place a caller may pin the geometry (`max-xs:fixed!`) */
  positionerClassName?: string | undefined
}

/**
 * Portal + positioner + popup. `initialFocus`/`finalFocus` pass through to the popup; the listed
 * positioner props pass to the positioner; everything else is the popup's.
 */
export function PopoverContent({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 8,
  collisionPadding = 12,
  collisionAvoidance,
  anchor,
  container,
  positionerClassName,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPortal container={container} className="contents">
      <PopoverPrimitive.Positioner
        data-slot="popover-positioner"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        collisionAvoidance={collisionAvoidance}
        anchor={anchor}
        className={cn(POSITIONER, positionerClassName)}
      >
        <PopoverPrimitive.Popup data-slot="popover-content" className={cn(POPUP, className)} {...props} />
      </PopoverPrimitive.Positioner>
    </PopoverPortal>
  )
}

export function PopoverHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="popover-header" className={cn('flex flex-col gap-0.5', className)} {...props} />
}

/** Base UI renders an `<h2>`; the UI face and label step, not the display ladder a bare h2 wears. */
export function PopoverTitle({ className, ...props }: Styled<PopoverPrimitive.Title.Props>) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn('m-0 font-sans text-base font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function PopoverDescription({ className, ...props }: Styled<PopoverPrimitive.Description.Props>) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn('m-0 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
