import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { meLou, paperMeme, questStepsFresh, questStepsPackDone, unreadSale } from '../../.storybook/fixtures'
import { PageContainer } from '../atoms/PageContainer'
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
  questExpanded: false,
  questDismissed: false,
}

const actions = {
  onLogout: fn(),
  onClaimPack: fn(),
  onDismissPack: fn(),
  onOpenAlerts: fn(),
  onToggleQuests: fn(),
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

/** 390×844: the phone chrome — sticky blur header with the theme button and the account menu, the fixed tab bar. */
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

export const LoggedIn: Story = {
  args: loggedIn,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    onThemeChange.mockClear()
    const nav = canvas.getByRole('navigation', { name: 'Main' })
    await expect(within(nav).getByRole('link', { name: 'Marketplace' })).toHaveAttribute('aria-current', 'page')
    await expect(within(nav).getByRole('link', { name: 'My Binder' })).not.toHaveAttribute('aria-current')
    await expect(canvas.getByRole('link', { name: 'Mint a meme' })).toHaveAttribute('href', '/binder/new')
    await expect(canvas.getByText('the meme trading card market')).toBeVisible()
    // the sidebar's segmented control marks the current arm and reports a change
    const theme = canvas.getByRole('group', { name: 'Theme' })
    await expect(within(theme).getByRole('button', { name: /Light/ })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(within(theme).getByRole('button', { name: /Dark/ }))
    await expect(onThemeChange).toHaveBeenCalledWith('dark')
    // the utility link and the identity gear both name Settings and both lead there
    const more = canvas.getByRole('navigation', { name: 'More' })
    await expect(within(more).getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
    await expect(canvas.getAllByRole('link', { name: 'Settings' })).toHaveLength(2)
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
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const profile = canvas.getByRole('link', { name: 'Your profile' })
    await expect(profile).toHaveAttribute('href', '/u/mask%2Favatar%20%2B%20one')
    // the Avatar atom paints the monogram until the picture has actually loaded
    await waitFor(() =>
      expect(profile.querySelector('img')).toHaveAttribute('src', '/brand/memeon-logo-circle-64.png'),
    )
    await expect(canvas.getByText(`${meLou.coins.toLocaleString()} braincells`)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Log out' }))
    await expect(args.logoutButtonProps.onClick).toHaveBeenCalledTimes(1)
  },
}

export const WithQuests: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, alerts: [unreadSale] },
    pathname: '/binder', theme: light,
    ...actions,
  }),
}

export const WithQuestsExpanded: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, questExpanded: true, alerts: [unreadSale] },
    pathname: '/binder', theme: light,
    ...actions,
  }),
}

/** 'Later' hides the strip until the next completion; the chrome is the route's again. */
export const QuestsDismissed: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, questDismissed: true, alerts: [unreadSale] },
    theme: light,
    ...actions,
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText('0/5')).toBeNull()
    await expect(within(canvasElement).queryByRole('button', { name: 'Later — hide quests for now' })).toBeNull()
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
    // the sidebar is display:none on the phone: the tab bar is the one main navigation
    const tabs = canvas.getByRole('navigation', { name: 'Main' })
    await expect(within(tabs).getByRole('link', { name: 'Market' })).toHaveAttribute('aria-current', 'page')
    await expect(within(tabs).getByRole('link', { name: 'Mint' })).toHaveAttribute('href', '/binder/new')
    await expect(canvas.queryByRole('link', { name: 'Your profile' })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Theme: Light. Switch to Dark' })).toBeVisible()
    // the avatar opens the account menu that carries the routes the tab bar cannot
    await userEvent.click(canvas.getByRole('button', { name: 'Account menu' }))
    const menu = await canvas.findByRole('menu')
    await expect(within(menu).getByRole('menuitem', { name: '🏆 Top Brains' })).toHaveAttribute('href', '/leaderboard')
    await expect(within(menu).getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull())
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
