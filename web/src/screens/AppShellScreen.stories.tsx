import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import { meLou, paperMeme, questStepsFresh, questStepsPackDone, unreadSale } from '../../.storybook/fixtures'
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

const loggedOut = buildAppShellScreenModel({ phase: 'loggedOut', user: null, context, ...actions })
const loggedIn = buildAppShellScreenModel({
  phase: 'loggedIn',
  user: meLou,
  context: { ...context, alerts: [unreadSale] },
  ...actions,
})

/** 390×844: the nav has to reach a second row instead of collapsing to zero width. */
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
  args: {
    ...loggedOut,
    children: <main className="container" id="main" tabIndex={-1}><p>page body</p></main>,
  },
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof AppShellScreen>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {}
export const LoggedIn: Story = { args: loggedIn }

export const WithAvatar: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn',
    user: { ...meLou, sub: 'mask/avatar + one', picture: '/brand/memeon-logo-circle-64.png' },
    context,
    ...actions,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const profile = canvas.getByRole('link', { name: 'Your profile' })
    await expect(profile).toHaveAttribute('href', '/u/mask%2Favatar%20%2B%20one')
    await expect(profile.querySelector('img')).toHaveAttribute('src', '/brand/memeon-logo-circle-64.png')
    await expect(canvas.getByText(`${meLou.coins.toLocaleString()} braincells`)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Log out' }))
    await expect(args.logoutButtonProps.onClick).toHaveBeenCalledTimes(1)
  },
}

export const WithQuests: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, alerts: [unreadSale] },
    ...actions,
  }),
}

export const WithQuestsExpanded: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, questExpanded: true, alerts: [unreadSale] },
    ...actions,
  }),
}

/** 'Later' hides the strip until the next completion; the chrome is the route's again. */
export const QuestsDismissed: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, questDismissed: true, alerts: [unreadSale] },
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
    ...actions,
  }),
}

export const PackOpened: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: {
      ...context, steps: questStepsPackDone, packMemes: [paperMeme], packReward: 20, alerts: [unreadSale],
    },
    ...actions,
  }),
}

/** Ten chrome controls precede the page: the first Tab must offer a way past them. */
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

export const Mobile390: Story = {
  args: buildAppShellScreenModel({
    phase: 'loggedIn', user: meLou,
    context: { ...context, steps: questStepsFresh, alerts: [unreadSale] },
    ...actions,
  }),
  ...phone,
}
