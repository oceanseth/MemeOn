import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import type { Styled } from '@/atoms/field'
import { Icon } from '@/atoms/icon'

/** House tick, duplicated in the three primitives so they do not share a check atom. Chrome matches Icon. */
function HouseTick() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7.757 12L10.409 14.652L16.243 8.818" />
    </svg>
  )
}

export function DropdownMenu(props: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

/** Pass `container={portalAnchor(id)}` (lib/portalAnchor) to keep the menu inside its screen. */
export function DropdownMenuPortal(props: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

export function DropdownMenuTrigger(props: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

/** Above the docked bars and the header; its own stacking context so the popup's z is local. */
const POSITIONER = 'isolate z-(--z-modal) outline-none'

export function DropdownMenuPositioner({
  className,
  ...props
}: Styled<MenuPrimitive.Positioner.Props>) {
  return (
    <MenuPrimitive.Positioner
      data-slot="dropdown-menu-positioner"
      className={cn(POSITIONER, className)}
      {...props}
    />
  )
}

/** A raised card of 44px rows, at least as wide as its trigger. */
const POPUP = cn(
  'max-h-(--available-height) w-(--anchor-width) min-w-52 origin-(--transform-origin) overflow-x-hidden overflow-y-auto scrollbar-thin',
  'rounded-lg material-pop p-2 text-foreground',
  'outline-none focus-ring',
  'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none!',
  'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
  'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
  'data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2',
)

type PositionerPassthrough = Pick<
  MenuPrimitive.Positioner.Props,
  | 'align'
  | 'alignOffset'
  | 'side'
  | 'sideOffset'
  | 'collisionPadding'
  | 'collisionAvoidance'
  | 'anchor'
>

export interface DropdownMenuContentProps
  extends Styled<MenuPrimitive.Popup.Props>,
    PositionerPassthrough {
  /** where the portal renders; pair `PortalAnchor` with `portalAnchor(id)` to stay inside the screen */
  container?: MenuPrimitive.Portal.Props['container']
  positionerClassName?: string | undefined
}

export function DropdownMenuContent({
  className,
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 8,
  collisionPadding = 12,
  collisionAvoidance,
  anchor,
  container,
  positionerClassName,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPortal container={container} className="contents">
      <MenuPrimitive.Positioner
        data-slot="dropdown-menu-positioner"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        collisionAvoidance={collisionAvoidance}
        anchor={anchor}
        className={cn(POSITIONER, positionerClassName)}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(POPUP, className)}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </DropdownMenuPortal>
  )
}

export function DropdownMenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

export function DropdownMenuLabel({
  className,
  inset,
  ...props
}: Styled<MenuPrimitive.GroupLabel.Props> & { inset?: boolean | undefined }) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset || undefined}
      className={cn(
        'px-3 py-1.5 text-sm font-semibold text-muted-foreground',
        inset && 'pl-10',
        className,
      )}
      {...props}
    />
  )
}

/**
 * A 44px row. The highlighted background is what a pointer user sees; the ring, landed inside the
 * popup's padding, is the accessible focus indicator. `destructive` is the strong red on the
 * error tint.
 */
export const dropdownMenuItemVariants = cva(
  cn(
    'group/dropdown-menu-item relative flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2',
    'text-base font-medium text-foreground no-underline select-none outline-none',
    'transition-tint focus-ring-inset disabled-look data-disabled:pointer-events-none',
    'data-highlighted:bg-accent',
  ),
  {
    variants: {
      variant: {
        default: '',
        destructive:
          'text-destructive data-highlighted:bg-error data-highlighted:text-error-foreground',
      },
      inset: {
        true: 'pl-10',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      inset: false,
    },
  },
)

export type DropdownMenuItemProps = Styled<MenuPrimitive.Item.Props> &
  VariantProps<typeof dropdownMenuItemVariants>

/** A row; `render={<Link to />}` makes it the link itself (Base UI keeps the menuitem role). */
export function DropdownMenuItem({ className, inset, variant, ...props }: DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset || undefined}
      data-variant={variant ?? 'default'}
      className={cn(dropdownMenuItemVariants({ variant, inset }), className)}
      {...props}
    />
  )
}

export function DropdownMenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

export function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: Styled<MenuPrimitive.SubmenuTrigger.Props> & {
  inset?: boolean | undefined
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset || undefined}
      className={cn(dropdownMenuItemVariants({ inset }), 'data-popup-open:bg-accent', className)}
      {...props}
    >
      {children}
      <Icon name="chevron-down" size={16} className="ml-auto -rotate-90 rtl:rotate-90" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

export function DropdownMenuSubContent({
  className,
  align = 'start',
  alignOffset = -8,
  side = 'right',
  sideOffset = 0,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn('w-auto min-w-40', className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

/** The check sits at the end of the row, as base-nova places it. */
const INDICATOR = 'pointer-events-none absolute right-3 flex size-4 items-center justify-center'

export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: Styled<MenuPrimitive.CheckboxItem.Props> & { inset?: boolean | undefined }) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset || undefined}
      className={cn(dropdownMenuItemVariants({ inset }), 'pr-10', className)}
      checked={checked}
      {...props}
    >
      <span className={INDICATOR} data-slot="dropdown-menu-checkbox-item-indicator">
        <MenuPrimitive.CheckboxItemIndicator>
          <HouseTick />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

export function DropdownMenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

export function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: Styled<MenuPrimitive.RadioItem.Props> & { inset?: boolean | undefined }) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset || undefined}
      className={cn(dropdownMenuItemVariants({ inset }), 'pr-10', className)}
      {...props}
    >
      <span className={INDICATOR} data-slot="dropdown-menu-radio-item-indicator">
        <MenuPrimitive.RadioItemIndicator>
          <HouseTick />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: Styled<MenuPrimitive.Separator.Props>) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-2 my-1.5 h-px bg-border', className)}
      {...props}
    />
  )
}

export function DropdownMenuShortcut({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn('ml-auto text-sm tracking-widest text-muted-foreground', className)}
      {...props}
    />
  )
}
