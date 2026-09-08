import { createRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import {
  meLou,
  paperMeme,
  questStepsFresh,
  questStepsPackDone,
  unreadSale,
} from '../../.storybook/fixtures'
import type { AppShellScreenModel } from '../hooks/useAppShellScreen'
import { AppShellScreen } from './AppShellScreen'

const bellRef = createRef<HTMLDivElement>()

const handlers = {
  onLogout: fn(),
  onClaimPack: fn(),
  onDismissPack: fn(),
  onOpenAlerts: fn(),
} satisfies Partial<AppShellScreenModel>

const loggedOut: AppShellScreenModel = {
  phase: 'loggedOut',
  user: null,
  steps: null,
  packMemes: null,
  packReward: 0,
  packBusy: false,
  alerts: [],
  alertsOpen: false,
  showNav: false,
  showToolbar: false,
  showAvatar: false,
  showQuest: false,
  coinsText: '',
  profileHref: '',
  bellRef,
  ...handlers,
}

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

export const LoggedIn: Story = {
  args: {
    phase: 'loggedIn',
    user: meLou,
    showNav: true,
    showToolbar: true,
    coinsText: `🧠 ${meLou.coins.toLocaleString()}`,
    profileHref: `/u/${encodeURIComponent(meLou.sub)}`,
    alerts: [unreadSale],
  },
}

export const WithQuests: Story = {
  args: {
    phase: 'loggedIn',
    user: meLou,
    steps: questStepsFresh,
    showNav: true,
    showToolbar: true,
    showQuest: true,
    coinsText: `🧠 ${meLou.coins.toLocaleString()}`,
    profileHref: `/u/${encodeURIComponent(meLou.sub)}`,
    alerts: [unreadSale],
  },
}

export const AlertsOpen: Story = {
  args: {
    phase: 'loggedIn',
    user: meLou,
    showNav: true,
    showToolbar: true,
    coinsText: `🧠 ${meLou.coins.toLocaleString()}`,
    profileHref: `/u/${encodeURIComponent(meLou.sub)}`,
    alerts: [unreadSale],
    alertsOpen: true,
  },
}

export const PackOpened: Story = {
  args: {
    phase: 'loggedIn',
    user: meLou,
    steps: questStepsPackDone,
    packMemes: [paperMeme],
    packReward: 20,
    showNav: true,
    showToolbar: true,
    showQuest: true,
    coinsText: `🧠 ${meLou.coins.toLocaleString()}`,
    profileHref: `/u/${encodeURIComponent(meLou.sub)}`,
    alerts: [unreadSale],
  },
}
