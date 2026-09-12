import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { meLou } from '../../.storybook/fixtures'
import { AvatarMenu, type AvatarMenuModel } from './AvatarMenu'

const onLogout = fn()

const model: AvatarMenuModel = {
  name: meLou.name,
  src: null,
  triggerProps: { 'aria-label': 'Account menu' },
  items: [
    { key: 'profile', label: 'Profile', to: `/u/${encodeURIComponent(meLou.sub)}` },
    { key: 'leaderboard', label: '🏆 Top Brains', to: '/leaderboard' },
    { key: 'settings', label: 'Settings', to: '/settings' },
    { key: 'developers', label: '🔧 Developers', to: '/developers' },
    { key: 'logout', label: 'Log out', onSelect: onLogout },
  ],
}

const meta = {
  title: 'Molecules/AvatarMenu',
  component: AvatarMenu,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="flex min-h-[320px] items-start justify-end p-6">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: { model },
} satisfies Meta<typeof AvatarMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Closed: the avatar is the trigger; one press opens the menu, Escape closes it and returns focus.
 *
 * The trigger's `aria-expanded` is not synchronous with the press. Base UI opens the menu on
 * `mousedown`, but the attribute comes from the popup store's *active* trigger props, which the
 * root writes in a layout effect once the popup has mounted (`usePopupInteractionProps`) — one
 * commit later than the state change. Asserting it bare after `userEvent.click` is therefore a
 * race that passes most of the time and fails when the run is slow, so both post-press assertions
 * are polled.
 */
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
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
    await expect(trigger).toHaveFocus()
  },
}

/** Open: the five rows, links where a route exists, Log out reporting to its handler. */
export const Open: Story = {
  args: { model: { ...model, defaultOpen: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onLogout.mockClear()
    const menu = await canvas.findByRole('menu')
    await expect(within(menu).getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', `/u/${encodeURIComponent(meLou.sub)}`)
    await expect(within(menu).getByRole('menuitem', { name: '🏆 Top Brains' })).toHaveAttribute('href', '/leaderboard')
    await expect(within(menu).getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    await expect(within(menu).getByRole('menuitem', { name: '🔧 Developers' })).toHaveAttribute('href', '/developers')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Log out' }))
    await expect(onLogout).toHaveBeenCalledTimes(1)
  },
}

export const Dark: Story = { ...Open, globals: { theme: 'dark' } }
