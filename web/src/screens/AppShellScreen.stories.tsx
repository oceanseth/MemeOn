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
  alerts: [],
  alertsOpen: false,
}

const actions = {
  onLogout: fn(),
  onClaimPack: fn(),
  onDismissPack: fn(),
  onOpenAlerts: fn(),
}

const loggedOut = buildAppShellScreenModel({ phase: 'loggedOut', user: null, context, ...actions })
const loggedIn = buildAppShellScreenModel({
  phase: 'loggedIn',
  user: meLou,
  context: { ...context, alerts: [unreadSale] },
  ...actions,
})

const meta = {
  title: 'Screens/AppShellScreen',
  component: AppShellScreen,
  args: {
    ...loggedOut,
    children: <main className="container"><p>page body</p></main>,
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
    const avatar = canvas.getByRole('img', { name: meLou.name })
    await expect(avatar).toHaveAttribute('src', '/brand/memeon-logo-circle-64.png')
    await expect(avatar.closest('a')).toHaveAttribute('href', '/u/mask%2Favatar%20%2B%20one')
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
