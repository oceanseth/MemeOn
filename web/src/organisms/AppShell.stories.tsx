import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link, MemoryRouter } from 'react-router-dom'
import { expect, fn, within } from 'storybook/test'
import { meLou, questStepsFresh, unreadSale } from '../../.storybook/fixtures'
import { Icon } from '../atoms/Icon'
import { PageContainer } from '../atoms/PageContainer'
import { buildAlertsBellModel } from '../lib/alertsBellModel'
import { buildQuestBarModel } from '../lib/questBarModel'
import { AlertsBell } from '../molecules/AlertsBell'
import { QuestBar } from '../molecules/QuestBar'
import { ThemeControl } from '../molecules/ThemeControl'
import { AppShell, NAV_ROW, PRIMARY_PILL, TAB_ITEM, TAB_ITEM_PRIMARY, UTILITY_LINK } from './AppShell'

const sidebar = (
  <>
    <nav className="mt-[38px] flex flex-col gap-[11px]" aria-label="Main">
      <Link to="/marketplace" className={NAV_ROW} aria-current="page">
        <Icon name="storefront" /> Marketplace
      </Link>
      <Link to="/binder" className={NAV_ROW}>
        <Icon name="book" /> My Binder
      </Link>
      <Link to="/friends" className={NAV_ROW}>
        <Icon name="users" /> Friends
      </Link>
      <Link to="/trade" className={NAV_ROW}>
        <Icon name="arrows-left-right" /> Trade
      </Link>
      <Link to="/leaderboard" className={NAV_ROW}>
        <span className="inline-flex size-[22px] items-center justify-center text-[19px] leading-none" aria-hidden="true">🏆</span> Top Brains
      </Link>
    </nav>
    <Link to="/binder/new" className={`${PRIMARY_PILL} mx-1 mt-[43px]`}>
      <span aria-hidden="true">＋</span> Mint a meme
    </Link>
    <div className="mt-auto flex flex-col pt-6">
      <ThemeControl model={{ value: 'light', onChange: fn(), variant: 'segmented' }} className="mx-1" />
      <nav className="mx-3 mt-4 flex flex-col items-start gap-[5px]" aria-label="More">
        <Link to="/discord" className={UTILITY_LINK}>Discord</Link>
        <Link to="/developers" className={UTILITY_LINK}>🔧  Developers</Link>
        <Link to="/settings" className={UTILITY_LINK} aria-current="page">Settings</Link>
      </nav>
    </div>
  </>
)

const headerEnd = (
  <>
    <ThemeControl model={{ value: 'auto', onChange: fn(), variant: 'button' }} className="2xl:hidden" />
    <span className="text-label font-semibold tabular-nums" data-slot="coins">
      <span aria-hidden="true">🧠 {meLou.coins.toLocaleString()}</span>
      <span className="sr-only">{meLou.coins.toLocaleString()} braincells</span>
    </span>
    <AlertsBell model={buildAlertsBellModel({ alerts: [unreadSale], open: false, onOpenChange: fn() })} />
  </>
)

const bottomNav = (
  <>
    <Link to="/marketplace" className={TAB_ITEM} aria-current="page"><Icon name="storefront" />Market</Link>
    <Link to="/binder" className={TAB_ITEM}><Icon name="book" />Binder</Link>
    <Link to="/binder/new" className={`${TAB_ITEM} ${TAB_ITEM_PRIMARY}`}><Icon name="circle-plus" />Mint</Link>
    <Link to="/friends" className={TAB_ITEM}><Icon name="users" />Friends</Link>
    <Link to="/trade" className={TAB_ITEM}><Icon name="arrows-left-right" />Trade</Link>
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
    headerEnd: <ThemeControl model={{ value: 'auto', onChange: fn(), variant: 'button' }} className="2xl:size-10 2xl:rounded-avatar 2xl:text-[18px]" />,
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
  },
}

export const Dark: Story = { ...LoggedIn, globals: { theme: 'dark' } }
