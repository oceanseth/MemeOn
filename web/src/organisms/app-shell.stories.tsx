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
import { QuestBar } from '@/molecules/quest-bar'
import { ThemeControl } from '@/molecules/theme-control'
import { AppShell } from '@/organisms/app-shell'
import { NavIcon, NavRow, TabItem, UtilityLink } from '@/organisms/nav-item'

const sidebar = (
  <>
    <nav className="mt-10 flex flex-col gap-3" aria-label="Main">
      <NavRow current render={<Link to="/marketplace" />}>
        <NavIcon><Icon name="storefront" /></NavIcon> Marketplace
      </NavRow>
      <NavRow render={<Link to="/binder" />}>
        <NavIcon><Icon name="book" /></NavIcon> My Binder
      </NavRow>
      <NavRow render={<Link to="/friends" />}>
        <NavIcon><Icon name="users" /></NavIcon> Friends
      </NavRow>
      <NavRow render={<Link to="/trade" />}>
        <NavIcon><Icon name="arrows-left-right" /></NavIcon> Trade
      </NavRow>
      <NavRow render={<Link to="/leaderboard" />}>
        <NavIcon>🏆</NavIcon> Top Brains
      </NavRow>
    </nav>
    <Link to="/binder/new" className={`${buttonVariants({ variant: 'primary' })} mx-1 mt-11`}>
      <span aria-hidden="true">＋</span> Mint a meme
    </Link>
    <div className="mt-auto flex flex-col pt-6">
      <ThemeControl model={{ value: 'light', onChange: fn(), variant: 'segmented' }} className="mx-1" />
      <nav className="mx-3 mt-4 flex flex-col items-start gap-1" aria-label="More">
        <UtilityLink render={<Link to="/discord" />}>Discord</UtilityLink>
        <UtilityLink render={<Link to="/developers" />}>🔧  Developers</UtilityLink>
        <UtilityLink current render={<Link to="/settings" />}>Settings</UtilityLink>
      </nav>
    </div>
  </>
)

const headerEnd = (
  <>
    <ThemeControl model={{ value: 'auto', onChange: fn(), variant: 'button' }} className="xl:hidden" />
    <span className="text-base font-semibold tabular-nums" data-slot="coins">
      <span aria-hidden="true">🧠 {meLou.coins.toLocaleString()}</span>
      <span className="sr-only">{meLou.coins.toLocaleString()} braincells</span>
    </span>
    <AlertsBell model={buildAlertsBellModel({ alerts: [unreadSale], open: false, onOpenChange: fn() })} />
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

/** 390×844: the phone chrome — sticky header, fixed tab bar. */
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
    await expect(canvas.queryByRole('complementary')).toBeNull()
    await expect(canvas.getByRole('navigation', { name: 'Footer' })).toBeInTheDocument()
  },
}

export const LoggedIn: Story = {
  args: { sidebar, contextLine: 'the meme trading card market', headerEnd, bottomNav },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('complementary')).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'Marketplace' })).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByRole('link', { name: 'Mint a meme' })).toHaveAttribute('href', '/binder/new')
    await expect(canvas.getByText('the meme trading card market')).toBeVisible()
  },
}

export const WithQuests: Story = {
  args: {
    sidebar,
    contextLine: 'the meme trading card market',
    headerEnd,
    bottomNav,
    quest: (
      <QuestBar
        model={buildQuestBarModel({
          steps: questStepsFresh,
          packMemes: null,
          packReward: 0,
          busy: false,
          onClaimPack: fn(),
          onDismissPack: fn(),
        })}
      />
    ),
  },
}

export const Phone390: Story = {
  ...LoggedIn,
  ...phone,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // the sidebar is display:none on the phone; the tab bar is the one main navigation
    await expect(canvas.queryByRole('complementary')).toBeNull()
    const tabs = canvas.getByRole('navigation', { name: 'Main' })
    await expect(within(tabs).getByRole('link', { name: 'Mint' })).toHaveAttribute('href', '/binder/new')
    await expect(canvas.getByRole('link', { name: 'MemeOn' })).toBeVisible()
    /* the column clears the fixed bar: 80 tall, 10 up, plus the home indicator (app-shell.css) */
    const content = canvasElement.querySelector('[data-slot="content"]')!
    await expect(getComputedStyle(content).paddingBottom).toBe('100px')
  },
}

export const Dark: Story = { ...LoggedIn, globals: { theme: 'dark' } }
