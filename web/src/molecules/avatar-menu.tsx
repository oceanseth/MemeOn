import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { Link } from 'react-router-dom'
import { Avatar } from '@/atoms/avatar'
import { buttonVariants } from '@/atoms/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '@/atoms/dropdown-menu'
import { PortalAnchor } from '@/atoms/portal-anchor'
import { portalAnchor } from '../lib/portalAnchor'

export type AvatarMenuItemModel =
  | { key: string; label: string; to: string }
  | { key: string; label: string; onSelect: () => void }

/**
 * The phone header's account menu. The design defers this surface ("avatar menu"); this is the
 * minimal product decision: the routes the desktop sidebar carries and the phone chrome cannot.
 */
export interface AvatarMenuModel {
  name: string
  src: string | null
  /** an avatar disc names nothing, so the trigger's name is the model's */
  triggerProps: { 'aria-label': string }
  items: AvatarMenuItemModel[]
  /** stories only: mount the menu open. The app leaves Base UI to own the open state. */
  defaultOpen?: boolean | undefined
}

/** One menu per page — it lives in the header — so one anchor id is enough (see AlertsBell). */
const ANCHOR_ID = 'avatar-menu-anchor'

/**
 * Profile · Top Brains · Settings · Developers · Log out behind the phone avatar, on the
 * `dropdown-menu` atom: Base UI owns the disclosure wiring (`aria-haspopup`, `aria-expanded`), the
 * arrow keys, typeahead, Escape and the outside press; the atom owns the paint. Non-modal on
 * purpose — a five-row menu needs no scroll lock. The trigger is the 34px header avatar on the
 * ghost icon button, which carries the coarse-pointer halo to 44.
 */
export function AvatarMenu({ model }: { model: AvatarMenuModel }) {
  return (
    <DropdownMenu modal={false} defaultOpen={model.defaultOpen}>
      {/* the primitive trigger in the ghost icon button's classes, not `<DropdownMenuTrigger
          render={<Button />}>`: Button does not forward its ref under React 18 (requested) and
          Base UI needs the trigger element; the lint cannot read a cva call on an atom */}
      <MenuPrimitive.Trigger
        className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
        data-slot="avatar-menu-trigger"
        {...model.triggerProps}
      >
        <Avatar name={model.name} src={model.src} size="header" />
      </MenuPrimitive.Trigger>
      <PortalAnchor id={ANCHOR_ID} />
      <DropdownMenuContent container={portalAnchor(ANCHOR_ID)} align="end" data-slot="avatar-menu">
        {model.items.map((item) =>
          'to' in item ? (
            // the row is the link itself; Base UI keeps `menuitem` on the anchor and closes on click
            <DropdownMenuItem key={item.key} render={<Link to={item.to} />} data-slot="avatar-menu-item">
              {item.label}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={item.key} onClick={item.onSelect} data-slot="avatar-menu-item">
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
