import { Link } from 'react-router-dom'
import { Avatar } from '@/atoms/avatar'
import { Button } from '@/atoms/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/atoms/dropdown-menu'
import { PortalAnchor } from '@/atoms/portal-anchor'
import { portalAnchor } from '../lib/portalAnchor'
import type { ThemePreference } from '../stores/themeStore'
import { THEME_OPTIONS } from '@/molecules/theme-control'
import { Icon, type IconName } from '@/atoms/icon'

export interface AvatarMenuItemModel {
  key: string
  label: string
  to: string
  /**
   * The row's glyph. Every row has one — the shell hands them down from its one slot → glyph map,
   * and the molecule never picks.
   */
  icon: IconName
}

/**
 * The account menu behind the header avatar, at every width: the routes the bar does not carry,
 * the appearance radio, and Log out — one press away, at every width.
 */
export interface AvatarMenuModel {
  name: string
  src: string | null
  /** an avatar disc names nothing, so the trigger's name is the model's */
  triggerProps: { 'aria-label': string }
  /**
   * The routes, in order: Profile · Top Brains · Settings · Developers · Discord, each wearing the
   * glyph its chrome slot wears elsewhere — Settings is the `gear` the bar has no room for.
   */
  items: AvatarMenuItemModel[]
  /** Auto · Light · Dark, under the model's label; the same three the Settings page offers. */
  theme: { label: string; value: ThemePreference; onChange: (preference: ThemePreference) => void }
  logOut: { label: string; onSelect: () => void }
  /** stories only: mount the menu open. The app leaves Base UI to own the open state. */
  defaultOpen?: boolean | undefined
}

/** One menu per page — it lives in the header — so one anchor id is enough (see AlertsBell). */
const ANCHOR_ID = 'avatar-menu-anchor'

/**
 * On the `dropdown-menu` atom: Base UI owns the disclosure wiring (`aria-haspopup`,
 * `aria-expanded`), the arrow keys, typeahead, Escape and the outside press; the atom owns the
 * paint. Non-modal on purpose — a short menu needs no scroll lock. The trigger is the 34px header
 * avatar on the ghost icon button, which carries the coarse-pointer halo to 44. The identity row
 * is the first group's label, so the routes are announced under your name; a theme radio item
 * keeps the menu open (Base UI's default for a radio), so switching arms is one press, not three.
 */
export function AvatarMenu({ model }: { model: AvatarMenuModel }) {
  return (
    <DropdownMenu modal={false} defaultOpen={model.defaultOpen}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" />}
        data-slot="avatar-menu-trigger"
        {...model.triggerProps}
      >
        <Avatar name={model.name} src={model.src} size="header" />
      </DropdownMenuTrigger>
      <PortalAnchor id={ANCHOR_ID} />
      <DropdownMenuContent container={portalAnchor(ANCHOR_ID)} align="end" className="w-64" data-slot="avatar-menu">
        <DropdownMenuGroup>
          <DropdownMenuLabel data-slot="avatar-menu-identity">
            <span className="flex items-center gap-2.5">
              <Avatar name={model.name} src={model.src} size="sm" />
              <span className="min-w-0 truncate text-base font-semibold text-foreground" data-slot="avatar-menu-name">
                {model.name}
              </span>
            </span>
          </DropdownMenuLabel>
          {model.items.map((item) => (
            // the row is the link itself; Base UI keeps `menuitem` on the anchor and closes on click
            <DropdownMenuItem key={item.key} render={<Link to={item.to} />} data-slot="avatar-menu-item">
              {/* The 18px lane, held by a fixed-size box rather than by the glyph, so a mark with a
                  narrower silhouette (`code`) still starts its label on the same vertical as a wide
                  one (`trophy`). The trailing space is not slop: it reproduces the theme radio's own
                  `<Icon /> {label}` spacing below, so every label in the popup — routes and radio
                  alike — sits on one column. */}
              <span aria-hidden="true" className="flex size-4.5 shrink-0 items-center justify-center">
                <Icon name={item.icon} size={18} />
              </span>{' '}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{model.theme.label}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={model.theme.value}
            onValueChange={(value) => model.theme.onChange(value as ThemePreference)}
            data-slot="avatar-menu-theme"
          >
            {THEME_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value} data-slot="avatar-menu-theme-option">
                <Icon name={option.icon} size={18} /> {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={model.logOut.onSelect} data-slot="avatar-menu-logout">
          {/* the only row the shell's slot map has no route for, so the glyph is picked here, the
              way the theme radio's are — and picked at all because one bare lane at the foot of a
              decorated column reads as a row that failed to load */}
          <span aria-hidden="true" className="flex size-4.5 shrink-0 items-center justify-center">
            <Icon name="log-out" size={18} />
          </span>{' '}
          {model.logOut.label}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
