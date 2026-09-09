import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, NavLink } from 'react-router-dom'
import { fn } from 'storybook/test'
import { meLou, questStepsFresh, unreadSale } from '../../.storybook/fixtures'
import { buildAlertsBellModel } from '../lib/alertsBellModel'
import { buildQuestBarModel } from '../lib/questBarModel'
import { AlertsBell } from '../molecules/AlertsBell'
import { QuestBar } from '../molecules/QuestBar'
import { AppShell } from './AppShell'

const nav = (
  <nav className="nav-links">
    <NavLink to="/marketplace">Marketplace</NavLink>
    <NavLink to="/binder">My Binder</NavLink>
    <NavLink to="/friends">Friends</NavLink>
    <NavLink to="/trade">Trade</NavLink>
    <NavLink to="/leaderboard">🏆 Top Brains</NavLink>
  </nav>
)

const toolbar = (
  <>
    <span className="coins">
      <span aria-hidden="true">🧠 {meLou.coins.toLocaleString()}</span>
      <span className="sr-only">{meLou.coins.toLocaleString()} braincells</span>
    </span>
    <AlertsBell model={buildAlertsBellModel({ alerts: [unreadSale], open: false, onOpenChange: fn() })} />
    <button>Log out</button>
  </>
)

const meta = {
  title: 'Organisms/AppShell',
  component: AppShell,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  args: {
    children: <main className="container" id="main" tabIndex={-1}><p>page body</p></main>,
  },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {}
export const LoggedIn: Story = { args: { nav, toolbar } }
export const WithQuests: Story = {
  args: {
    nav,
    toolbar,
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
