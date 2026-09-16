import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link, MemoryRouter } from 'react-router-dom'
import { expect, within } from 'storybook/test'
import { Icon } from '@/atoms/icon'
import { NavPill, TabItem } from '@/organisms/nav-item'

const meta = {
  title: 'Organisms/NavItem',
  component: NavPill,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof NavPill>

export default meta
type Story = StoryObj<typeof meta>

/** The bar's links: the current one is the pressed well, the rest tint on hover. */
export const TopBarPills: Story = {
  render: () => (
    <nav className="flex items-center gap-1" aria-label="Main">
      <NavPill current render={<Link to="/marketplace" />}>Marketplace</NavPill>
      <NavPill render={<Link to="/binder" />}>My Binder</NavPill>
      <NavPill render={<Link to="/leaderboard" />}>
        <span aria-hidden="true">🏆</span> Top Brains
      </NavPill>
    </nav>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const current = canvas.getByRole('link', { name: 'Marketplace' })
    await expect(current).toHaveAttribute('aria-current', 'page')
    await expect(current).toHaveAttribute('data-slot', 'nav-pill')
    /* 36px pill */
    await expect(getComputedStyle(current).height).toBe('36px')
    await expect(canvas.getByRole('link', { name: 'My Binder' })).not.toHaveAttribute('aria-current')
    /* the emoji leads the label and stays out of the name */
    await expect(canvas.getByRole('link', { name: 'Top Brains' })).toHaveTextContent('🏆 Top Brains')
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

export const Dark: Story = { ...TopBarPills, globals: { theme: 'dark' } }
