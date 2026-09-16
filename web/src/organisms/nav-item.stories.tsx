import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link, MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { Icon } from '@/atoms/icon'
import { NavIcon, NavRow, TabItem, UtilityLink } from '@/organisms/nav-item'

const meta = {
  title: 'Organisms/NavItem',
  component: NavRow,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof NavRow>

export default meta
type Story = StoryObj<typeof meta>

/** The sidebar's rows: the current one is the pressed well, the rest tint on hover. */
export const SidebarRows: Story = {
  render: () => (
    <nav className="flex w-54 flex-col gap-3" aria-label="Main">
      <NavRow current render={<Link to="/marketplace" />}>
        <NavIcon><Icon name="storefront" /></NavIcon> Marketplace
      </NavRow>
      <NavRow render={<Link to="/binder" />}>
        <NavIcon><Icon name="book" /></NavIcon> My Binder
      </NavRow>
      <NavRow render={<Link to="/leaderboard" />}>
        <NavIcon>🏆</NavIcon> Top Brains
      </NavRow>
    </nav>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const current = canvas.getByRole('link', { name: 'Marketplace' })
    await expect(current).toHaveAttribute('aria-current', 'page')
    await expect(current).toHaveAttribute('data-slot', 'nav-row')
    /* 48px row, whatever sits in the lane */
    await expect(getComputedStyle(current).height).toBe('48px')
    await expect(canvas.getByRole('link', { name: 'My Binder' })).not.toHaveAttribute('aria-current')
    const lane = canvasElement.querySelectorAll('[data-slot="nav-icon"]')
    await expect(getComputedStyle(lane[0]!).width).toBe('22px')
  },
}

/** The utility rows under the nav: 36px, the current one pressed. */
export const UtilityRows: Story = {
  render: () => (
    <nav className="flex w-54 flex-col items-start gap-1" aria-label="More">
      <UtilityLink render={<Link to="/discord" />}>Discord</UtilityLink>
      <UtilityLink current render={<Link to="/settings" />}>Settings</UtilityLink>
    </nav>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const current = canvas.getByRole('link', { name: 'Settings' })
    await expect(current).toHaveAttribute('aria-current', 'page')
    await expect(getComputedStyle(current).height).toBe('36px')
  },
}

/** The phone tab bar: five 62×44 items, one of them the action-coloured Mint. */
export const TabBarItems: Story = {
  render: () => (
    <nav className="flex items-center gap-1" aria-label="Main">
      <TabItem current render={<Link to="/marketplace" />}><Icon name="storefront" />Market</TabItem>
      <TabItem render={<Link to="/binder" />}><Icon name="book" />Binder</TabItem>
      <TabItem primary render={<Link to="/binder/new" />}><Icon name="circle-plus" />Mint</TabItem>
    </nav>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const mint = canvas.getByRole('link', { name: 'Mint' })
    await expect(mint).toHaveAttribute('data-primary', '')
    await expect(mint).toHaveAttribute('data-slot', 'tab-item')
    /* only the Mint item is primary; a plain tab writes no attribute at all */
    await expect(canvas.getByRole('link', { name: 'Binder' })).not.toHaveAttribute('data-primary')
    await expect(getComputedStyle(mint).width).toBe('62px')
    await expect(getComputedStyle(mint).height).toBe('44px')
  },
}

export const Dark: Story = { ...SidebarRows, globals: { theme: 'dark' } }
