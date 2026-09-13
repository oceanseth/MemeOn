import { Menu } from '@base-ui/react/menu'
import { Link } from 'react-router-dom'
import { Avatar } from '../atoms/Avatar'
import { cn } from '../lib/cn'
import { FOCUS_RING as FOCUS } from '../lib/focus'

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

const anchorContainer = {
  get current(): HTMLElement | null {
    return document.getElementById(ANCHOR_ID)
  },
}

/** The 34px header avatar (`atoms/Avatar` size `header`), with the coarse-pointer halo to 44. */
const TRIGGER = cn(
  'relative inline-flex shrink-0 cursor-pointer rounded-control-sm border-0 bg-transparent p-0',
  'pointer-coarse:before:absolute pointer-coarse:before:-inset-1.25 pointer-coarse:before:content-[""]',
  FOCUS,
)

/** A raised card of 44px rows. */
const POPUP = cn(
  'min-w-52 rounded-card bg-surface p-2 shadow-pop outline-none',
  FOCUS,
)

/**
 * A row keeps the app's ring like every other control; the offset is negative so the 3px lands
 * inside the popup's own padding instead of overpainting its edge. The highlighted background stays
 * — it is what a pointer user sees — but it is not the accessible focus indicator on its own.
 */
const ITEM = cn(
  'flex min-h-11 w-full cursor-pointer items-center rounded-field border-0 bg-transparent px-3',
  'text-label font-medium text-ink no-underline select-none',
  'data-highlighted:bg-surface-raised',
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:-outline-offset-2',
  'contrast-more:focus-visible:outline-4',
  'forced-colors:focus-visible:outline-[Highlight]',
)

/**
 * Profile · Top Brains · Settings · Developers · Log out behind the phone avatar, on Base UI's
 * Menu: it owns the disclosure wiring (`aria-haspopup`, `aria-expanded`), the arrow keys, typeahead,
 * Escape and the outside press. Non-modal on purpose — a five-row menu needs no scroll lock.
 */
export function AvatarMenu({ model }: { model: AvatarMenuModel }) {
  return (
    <Menu.Root modal={false} defaultOpen={model.defaultOpen}>
      <Menu.Trigger className={TRIGGER} data-slot="avatar-menu-trigger" {...model.triggerProps}>
        <Avatar name={model.name} src={model.src} size="header" />
      </Menu.Trigger>
      <span id={ANCHOR_ID} className="contents" data-slot="avatar-menu-anchor" />
      <Menu.Portal container={anchorContainer} className="contents">
        <Menu.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={12}>
          <Menu.Popup className={POPUP} data-slot="avatar-menu">
            {model.items.map((item) =>
              'to' in item ? (
                <Menu.LinkItem
                  key={item.key}
                  render={<Link to={item.to} />}
                  closeOnClick
                  className={ITEM}
                  data-slot="avatar-menu-item"
                >
                  {item.label}
                </Menu.LinkItem>
              ) : (
                <Menu.Item key={item.key} onClick={item.onSelect} className={ITEM} data-slot="avatar-menu-item">
                  {item.label}
                </Menu.Item>
              ),
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
