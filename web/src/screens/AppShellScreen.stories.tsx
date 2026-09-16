import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { meLou, paperMeme, questStepsFresh, questStepsPackDone, unreadSale } from '../../.storybook/fixtures'
import { PageContainer } from '@/atoms/page-container'
import { buildAppShellScreenModel } from '../hooks/useAppShellScreen'
import type { AppShellContext } from '../stores/appShellMachine'
import { AppShellScreen } from './AppShellScreen'

const context: AppShellContext = {
  steps: null,
  packMemes: null,
  packReward: 0,
  packBusy: false,
  claimError: null,
  alerts: [],
  alertsOpen: false,
  alertsError: false,
  wasUnread: [],
  questDismissed: false,
}

const actions = {
  onLogout: fn(),
  onClaimPack: fn(),
  onDismissPack: fn(),
  onOpenAlerts: fn(),
  onDismissQuests: fn(),
}

const onThemeChange = fn()
const light = { value: 'light', onChange: onThemeChange } as const
const dark = { value: 'dark', onChange: onThemeChange } as const

const loggedOut = buildAppShellScreenModel({ phase: 'loggedOut', user: null, context, theme: light, ...actions })
const loggedIn = buildAppShellScreenModel({
  phase: 'loggedIn',
  user: meLou,
  context: { ...context, alerts: [unreadSale] },
  pathname: '/marketplace',
  theme: light,
  ...actions,
})

/** 390×844: the phone chrome — sticky blur header with the braincell pill, bell and account menu; the fixed tab bar. */
const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

const meta = {
  title: 'Screens/AppShellScreen',
  component: AppShellScreen,
  /* the chrome owns the viewport edge: no Storybook gutter, or the 390 header loses 32 of its 350 */
  parameters: { layout: 'fullscreen' },
  args: {
    ...loggedOut,
    children: <PageContainer as="main" id="main" tabIndex={-1}><p>page body</p></PageContainer>,
  },
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof AppShellScreen>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onThemeChange.mockClear()
    await expect(canvas.getByRole('link', { name: 'MemeOn' })).toBeVisible()
    await expect(canvas.queryByRole('navigation', { name: 'Main' })).toBeNull()
    // the public header carries the one theme control; it names where it is and where it goes
    await userEvent.click(canvas.getByRole('button', { name: 'Theme: Light. Switch to Dark' }))
    await expect(onThemeChange).toHaveBeenCalledWith('dark')
  },
}

/** The bar: five links, Mint, the plain braincell pill (no ladder), the bell, the account menu. */
export const LoggedIn: Story = {
  args: loggedIn,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onThemeChange.mockClear()
    const nav = canvas.getByRole('navigation', { name: 'Main' })
    await expect(nav).toHaveAttribute('data-slot', 'top-nav')
    await expect(within(nav).getByRole('link', { name: 'Marketplace' })).toHaveAttribute('aria-current', 'page')
    await expect(within(nav).getByRole('link', { name: 'My Binder' })).not.toHaveAttribute('aria-current')
    await expect(within(nav).getByRole('link', { name: 'Top Brains' })).toHaveAttribute('href', '/leaderboard')
    await expect(canvas.getByRole('link', { name: 'Mint' })).toHaveAttribute('href', '/binder/new')
    // the ladder is not live, so the pill is a plain balance: no ring, no button
    await expect(canvas.getByText(`${meLou.coins.toLocaleString()} braincells`)).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /quests/ })).toBeNull()
    // no theme button in the signed-in bar: the account menu's radio marks the arm and reports a change
    await expect(canvas.queryByRole('button', { name: /^Theme:/ })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Account menu' }))
    const menu = await canvas.findByRole('menu')
    await expect(within(menu).getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    await expect(within(menu).getByRole('menuitem', { name: 'Discord' })).toHaveAttribute('href', '/discord')
    await expect(within(menu).getByRole('menuitemradio', { name: /Light/ })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: /Dark/ }))
    await expect(onThemeChange).toHaveBeenCalledWith('dark')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull())
  },
}

export const WithAvatar: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn',
    user: { ...meLou, sub: 'mask/avatar + one', picture: '/brand/memeon-logo-circle-64.png' },
    context,
    theme: light,
    ...actions,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    actions.onLogout.mockClear()
    const trigger = canvas.getByRole('button', { name: 'Account menu' })
    // the Avatar atom paints the monogram until the picture has actually loaded
    await waitFor(() =>
      expect(trigger.querySelector('img')).toHaveAttribute('src', '/brand/memeon-logo-circle-64.png'),
    )
    await expect(canvas.getByText(`${meLou.coins.toLocaleString()} braincells`)).toBeInTheDocument()
    await userEvent.click(trigger)
    const menu = await canvas.findByRole('menu')
    await expect(within(menu).getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', '/u/mask%2Favatar%20%2B%20one')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Log out' }))
    await expect(actions.onLogout).toHaveBeenCalledTimes(1)
  },
}

/** The ladder is live: the pill wears the ring and the claim dot, and a press opens the whole rail. */
export const WithQuests: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, alerts: [unreadSale] },
    pathname: '/binder', theme: light,
    ...actions,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: /quests 0 of 5/ })
    await expect(trigger).toHaveAttribute('data-slot', 'quest-trigger')
    await expect(trigger).toHaveAttribute('data-progress', '0')
    await expect(trigger.querySelector('[data-slot="quest-claim-dot"]')).not.toBeNull()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    await expect(await canvas.findByText('Earn your braincells')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /claim your starter pack/i })).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: /Mint your first meme/ })).toHaveAttribute('href', '/binder/new')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByText('Earn your braincells')).toBeNull())
  },
}

/** Same shell as WithQuests — kept for the second quest inventory row. */
export const WithQuestsExpanded: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, alerts: [unreadSale] },
    pathname: '/binder', theme: light,
    ...actions,
  }),
}

/** 'Later' hides the ladder until the next completion; the pill is the plain balance again. */
export const QuestsDismissed: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, questDismissed: true, alerts: [unreadSale] },
    theme: light,
    ...actions,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: /quests/ })).toBeNull()
    await expect(canvas.queryByText('0/5')).toBeNull()
    await expect(canvas.queryByRole('button', { name: 'Later — hide quests for now' })).toBeNull()
  },
}

export const AlertsOpen: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, alerts: [unreadSale], alertsOpen: true },
    pathname: '/marketplace', theme: light,
    ...actions,
  }),
}

export const PackOpened: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: {
      ...context, steps: questStepsPackDone, packMemes: [paperMeme], packReward: 20, alerts: [unreadSale],
    },
    pathname: '/binder', theme: light,
    ...actions,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // one step in: the ring reads a fifth (probed by slot — the modal pack dialog makes the bar inert), and the dialog is up
    await expect(canvasElement.querySelector('[data-slot="quest-trigger"]')).toHaveAttribute('data-progress', '20')
    await expect(await canvas.findByRole('dialog', { name: /Starter pack opened/ })).toBeInTheDocument()
  },
}

/** A dozen chrome controls precede the page: the first Tab must offer a way past them. */
export const SkipLinkFocused: Story = {
  args: loggedIn,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    const skip = canvas.getByRole('link', { name: 'Skip to content' })
    await expect(skip).toHaveFocus()
    await expect(skip).toHaveAttribute('href', '#main')
    await expect(canvasElement.querySelector('#main')).toBeInTheDocument()
  },
}

export const Phone390: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, alerts: [unreadSale] },
    pathname: '/marketplace', theme: light,
    ...actions,
  }),
  ...phone,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // the bar's links are display:none on the phone: the tab bar is the one main navigation
    const tabs = canvas.getByRole('navigation', { name: 'Main' })
    await expect(tabs).toHaveAttribute('data-slot', 'bottom-nav')
    await expect(within(tabs).getByRole('link', { name: 'Market' })).toHaveAttribute('aria-current', 'page')
    await expect(within(tabs).getByRole('link', { name: 'Mint' })).toHaveAttribute('href', '/binder/new')
    // the phone cluster is the pill, the bell and the avatar: no theme button, no header Mint
    await expect(canvas.queryByRole('button', { name: /^Theme:/ })).toBeNull()
    await expect(canvas.getAllByRole('link', { name: 'Mint' })).toHaveLength(1)
    await expect(canvas.getByRole('button', { name: /quests 0 of 5/ })).toBeVisible()
    // the avatar opens the account menu that carries the routes the tab bar cannot, and the theme
    await userEvent.click(canvas.getByRole('button', { name: 'Account menu' }))
    const menu = await canvas.findByRole('menu')
    await expect(within(menu).getByRole('menuitem', { name: '🏆 Top Brains' })).toHaveAttribute('href', '/leaderboard')
    await expect(within(menu).getByRole('menuitemradio', { name: /Dark/ })).toBeInTheDocument()
    // the site footer is gone under the tab bar, so the menu is the phone's door to the legal pages
    await expect(within(menu).getByRole('menuitem', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    await expect(within(menu).getByRole('menuitem', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    await expect(within(menu).getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull())
    await expect(canvasElement.querySelector('[data-slot="site-footer"]')).not.toBeVisible()
  },
}

/** Kept under its historical name; `Phone390` is the same chrome with its assertions. */
export const Mobile390: Story = {
  args: Phone390.args,
  ...phone,
}

export const Dark: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, alerts: [unreadSale] },
    pathname: '/marketplace', theme: dark,
    ...actions,
  }),
  globals: { theme: 'dark' },
}

export const DarkPhone390: Story = {
  args: Dark.args,
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}
