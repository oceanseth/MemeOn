import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link, MemoryRouter } from 'react-router-dom'
import { expect, fn, within } from 'storybook/test'
import { meLou, questStepsFresh, unreadSale } from '../../.storybook/fixtures'
import { buttonVariants } from '@/atoms/button'
import { Icon } from '@/atoms/icon'
import { PageContainer } from '@/atoms/page-container'
import { buildAlertsBellModel } from '../lib/alertsBellModel'
import { buildQuestBarModel } from '../lib/questBarModel'
import { AlertsBell } from '@/molecules/alerts-bell'
import { AvatarMenu } from '@/molecules/avatar-menu'
import { QuestBar } from '@/molecules/quest-bar'
import { ThemeControl } from '@/molecules/theme-control'
import { AppShell } from '@/organisms/app-shell'
import { NavPill, TabItem } from '@/organisms/nav-item'

const nav = (
  <>
    <NavPill current render={<Link to="/marketplace" />}>Marketplace</NavPill>
    <NavPill render={<Link to="/binder" />}>My Binder</NavPill>
    <NavPill render={<Link to="/friends" />}>Friends</NavPill>
    <NavPill render={<Link to="/trade" />}>Trade</NavPill>
    <NavPill render={<Link to="/leaderboard" />}>
      <span aria-hidden="true">
        <Icon name="trophy" size={16} />
      </span>{' '}
      Top Brains
    </NavPill>
  </>
)

const balance = { text: `${meLou.coins.toLocaleString()}`, label: `${meLou.coins.toLocaleString()} braincells` }

const avatarMenu = (
  <AvatarMenu
    model={{
      name: meLou.name,
      src: null,
      triggerProps: { 'aria-label': 'Account menu' },
      items: [
        { key: 'profile', label: 'Profile', to: `/u/${meLou.sub}` },
        { key: 'settings', label: 'Settings', to: '/settings' },
      ],
      theme: { label: 'Theme', value: 'light', onChange: fn() },
      logOut: { label: 'Log out', onSelect: fn() },
    }}
  />
)

const headerEnd = (quest: boolean) => (
  <>
    <Link to="/binder/new" className={`${buttonVariants({ variant: 'primary', size: 'sm' })} max-xl:hidden`}>
      <span aria-hidden="true">＋</span> Mint
    </Link>
    <QuestBar
      model={quest ? buildQuestBarModel({
        steps: questStepsFresh,
        packMemes: null,
        packReward: 0,
        busy: false,
        onClaimPack: fn(),
        onDismissPack: fn(),
      }) : null}
      balance={balance}
    />
    <AlertsBell model={buildAlertsBellModel({ alerts: [unreadSale], open: false, onOpenChange: fn() })} />
    {avatarMenu}
  </>
)

const bottomNav = (
  <>
    <TabItem current render={<Link to="/marketplace" />}><Icon name="storefront" />Market</TabItem>
    <TabItem render={<Link to="/binder" />}><Icon name="book" />Binder</TabItem>
    <TabItem primary render={<Link to="/binder/new" />}><Icon name="circle-plus" />Mint</TabItem>
    <TabItem render={<Link to="/friends" />}><Icon name="users" />Friends</TabItem>
    <TabItem render={<Link to="/trade" />}><Icon name="arrows-left-right" />Trade</TabItem>
  </>
)

/** 390×844: the phone chrome — sticky header, the tab bar flush with the bottom edge. */
const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

const meta = {
  title: 'Organisms/AppShell',
  component: AppShell,
  /* the chrome owns the viewport edge: no Storybook gutter, or the 390 header loses 32 of its 350 */
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  args: {
    children: <PageContainer as="main" id="main" tabIndex={-1}><p>page body</p></PageContainer>,
  },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

/** The public frame: wordmark, the theme button, the page, the footer. */
export const LoggedOut: Story = {
  args: {
    headerEnd: <ThemeControl model={{ value: 'auto', onChange: fn(), variant: 'button' }} size="lg" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'MemeOn' })).toHaveAttribute('href', '/')
    await expect(canvas.queryByRole('navigation', { name: 'Main' })).toBeNull()
    await expect(canvasElement.querySelector('[data-slot="app-frame"]')).toHaveAttribute('data-layout', 'public')
    await expect(canvas.getByRole('navigation', { name: 'Footer' })).toBeInTheDocument()
  },
}

/** The signed-in frame from the cut: the bar with its links and cluster, the page, the footer; the tab bar hidden. */
export const LoggedIn: Story = {
  args: { nav, headerEnd: headerEnd(false), bottomNav },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelector('[data-slot="app-frame"]')).toHaveAttribute('data-layout', 'app')
    const bar = canvas.getByRole('banner')
    await expect(bar).toHaveAttribute('data-slot', 'header')
    /* the bar is the sticky-chrome contract's 64 (`--topbar-h`) at every width */
    await expect(getComputedStyle(bar.querySelector('[data-slot="header-row"]')!).height).toBe('64px')
    await expect(getComputedStyle(bar).position).toBe('sticky')
    await expect(canvas.getByRole('link', { name: 'Marketplace' })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByRole('link', { name: 'Mint' })).toHaveAttribute('href', '/binder/new')
    await expect(canvas.getByText(`${meLou.coins.toLocaleString()} braincells`)).toBeInTheDocument()
    /* from the cut the footer is the page's end, tab bar or not */
    await expect(canvas.getByRole('navigation', { name: 'Footer' })).toBeVisible()
  },
}

export const WithQuests: Story = {
  args: { nav, headerEnd: headerEnd(true), bottomNav },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /quests 0 of 5/ })).toHaveAttribute('data-progress', '0')
  },
}

export const Phone390: Story = {
  ...LoggedIn,
  ...phone,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // the bar's links are display:none on the phone; the tab bar is the one main navigation
    const tabs = canvas.getByRole('navigation', { name: 'Main' })
    await expect(tabs).toHaveAttribute('data-slot', 'bottom-nav')
    await expect(within(tabs).getByRole('link', { name: 'Mint' })).toHaveAttribute('href', '/binder/new')
    await expect(canvas.getByRole('link', { name: 'MemeOn' })).toBeVisible()
    /* the bar is the phone's: fixed to the viewport's bottom edge and spanning it, no gap */
    const box = tabs.getBoundingClientRect()
    await expect(getComputedStyle(tabs).position).toBe('fixed')
    await expect(box.bottom).toBe(document.documentElement.clientHeight)
    await expect(box.left).toBe(0)
    await expect(box.width).toBe(document.documentElement.clientWidth)
    await expect(getComputedStyle(tabs).borderRadius).toBe('0px')
    /* the column clears the bar: the 80 row plus the home indicator (app-shell.css) */
    const content = canvasElement.querySelector('[data-slot="content"]')!
    await expect(getComputedStyle(content).paddingBottom).toBe('80px')
    /* a phone app has no site footer: where the tab bar is, the footer is not */
    await expect(canvasElement.querySelector('[data-slot="site-footer"]')).not.toBeVisible()
  },
}

export const Dark: Story = { ...LoggedIn, globals: { theme: 'dark' } }
