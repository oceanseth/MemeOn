import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, NavLink } from 'react-router-dom'
import { fn } from 'storybook/test'
import { meLou, questStepsFresh, unreadSale } from '../../.storybook/fixtures'
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
    <span className="coins" title="Braincells">
      🧠 {meLou.coins.toLocaleString()}
    </span>
    <AlertsBell alerts={[unreadSale]} open={false} onOpenChange={fn()} />
    <button>Log out</button>
  </>
)

const meta = {
  title: 'Organisms/AppShell',
  component: AppShell,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  args: {
    children: <main className="container"><p>page body</p></main>,
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
        steps={questStepsFresh}
        packMemes={null}
        packReward={0}
        busy={false}
        onClaimPack={fn()}
        onDismissPack={fn()}
      />
    ),
  },
}
