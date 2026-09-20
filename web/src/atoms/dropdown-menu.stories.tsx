import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Link } from 'react-router-dom'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  type DropdownMenuContentProps,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/atoms/dropdown-menu'
import { PortalAnchor } from '@/atoms/portal-anchor'
import { portalAnchor } from '../lib/portalAnchor'

/**
 * The anchor the portal renders into, so the queries below find the menu where the app would.
 * Passed in `render`, never through `args`: the getter ref resolves to a DOM node, which Storybook
 * cannot serialise.
 */
const ANCHOR = 'dropdown-menu-story-anchor'
const onLogout = fn()
const onSettings = fn()

/** The phone header's account menu, with every part the registry ships. */
function Demo({
  defaultOpen,
  ...content
}: DropdownMenuContentProps & { defaultOpen?: boolean | undefined }) {
  return (
    <div className="flex min-h-96 items-start justify-end p-6">
      <DropdownMenu modal={false} defaultOpen={defaultOpen}>
        <DropdownMenuTrigger>Account menu</DropdownMenuTrigger>
        <PortalAnchor id={ANCHOR} />
        <DropdownMenuContent container={portalAnchor(ANCHOR)} {...content}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Signed in as Lou</DropdownMenuLabel>
            <DropdownMenuItem render={<Link to="/u/lou" />}>Profile</DropdownMenuItem>
            <DropdownMenuItem render={<Link to="/leaderboard" />}>Top Brains</DropdownMenuItem>
            <DropdownMenuItem onClick={onSettings}>
              Settings
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Show read alerts</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="light">
            <DropdownMenuRadioItem value="auto">Auto</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent container={portalAnchor(ANCHOR)}>
              <DropdownMenuItem render={<Link to="/developers" />}>Developers</DropdownMenuItem>
              <DropdownMenuItem inset>Indented</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onLogout}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const meta = {
  title: 'Atoms/DropdownMenu',
  component: DropdownMenuContent,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: { align: 'end' },
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof DropdownMenuContent>

export default meta
type Story = StoryObj<typeof meta>

/** Open: rows are links where a route exists, the destructive row reports to its handler. */
export const Open: Story = {
  render: (args) => <Demo {...args} defaultOpen />,
  play: async ({ canvasElement }) => {
    onLogout.mockClear()
    onSettings.mockClear()
    const canvas = within(canvasElement)
    const menu = await canvas.findByRole('menu')
    await expect(canvasElement.contains(menu)).toBe(true)
    await expect(menu).toHaveAttribute('data-slot', 'dropdown-menu-content')
    // `render={<Link/>}` keeps the menuitem role on the anchor itself
    const profile = within(menu).getByRole('menuitem', { name: 'Profile' })
    await expect(profile).toHaveAttribute('href', '/u/lou')
    await expect(profile).toHaveAttribute('data-slot', 'dropdown-menu-item')
    await expect(profile.offsetHeight).toBeGreaterThanOrEqual(44)
    await expect(within(menu).getByRole('menuitem', { name: 'Top Brains' })).toHaveAttribute(
      'href',
      '/leaderboard',
    )
    const checked = within(menu).getByRole('menuitemcheckbox', {
      name: 'Show read alerts',
    })
    await expect(checked).toHaveAttribute('aria-checked', 'true')
    await expect(checked.querySelector('svg')).not.toBeNull()
    await expect(within(menu).getByRole('menuitemradio', { name: 'Light' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    const more = within(menu).getByRole('menuitem', { name: 'More' })
    await expect(more).toHaveAttribute('aria-haspopup', 'menu')
    await expect(more.querySelector('svg')).not.toBeNull()
    const logout = within(menu).getByRole('menuitem', { name: 'Log out' })
    await expect(logout).toHaveAttribute('data-variant', 'destructive')
    await userEvent.click(logout)
    await expect(onLogout).toHaveBeenCalledTimes(1)
  },
}

/** Closed: one press opens the menu, Escape closes it and returns focus to the trigger. */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Account menu' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByRole('menu')).toBeNull()
    await userEvent.click(trigger)
    await expect(await canvas.findByRole('menu')).toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull())
    await expect(trigger).toHaveFocus()
  },
}

/** Opened from the keyboard, the rows take the highlight; End and Home jump to the last and first. */
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Account menu' })
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    const menu = await canvas.findByRole('menu')
    // Base UI moves focus into the popup on the next frame; keys before that would hit the trigger
    await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true))
    await userEvent.keyboard('{End}')
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: 'Log out' })).toHaveAttribute(
        'data-highlighted',
      ),
    )
    await userEvent.keyboard('{Home}')
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: 'Profile' })).toHaveAttribute(
        'data-highlighted',
      ),
    )
    // the highlighted row wears the accent fill
    const profile = within(menu).getByRole('menuitem', { name: 'Profile' })
    await expect(getComputedStyle(profile).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  },
}

export const Dark: Story = { ...Open, globals: { theme: 'dark' } }
