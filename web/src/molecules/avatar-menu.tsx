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

export interface AvatarMenuItemModel {
  key: string
  label: string
  to: string
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
  /** The routes, in order: Profile · 🏆 Top Brains · Settings · 🔧 Developers · Discord. */
  items: AvatarMenuItemModel[]
  /** 🌗 Auto · ☀️ Light · 🌙 Dark, under the model's label; the same three the Settings page offers. */
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
                <span aria-hidden="true">{option.emoji}</span> {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={model.logOut.onSelect} data-slot="avatar-menu-logout">
          {model.logOut.label}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
