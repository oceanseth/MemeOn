import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, NavLink } from 'react-router-dom'
import { fn } from 'storybook/test'
import { meLou, questStepsFresh, unreadSale } from '../../.storybook/fixtures'
import { Button } from '../atoms/Button'
import { PageContainer } from '../atoms/PageContainer'
import { buildAlertsBellModel } from '../lib/alertsBellModel'
import { buildQuestBarModel } from '../lib/questBarModel'
import { AlertsBell } from '../molecules/AlertsBell'
import { QuestBar } from '../molecules/QuestBar'
import { AppShell, NAV_LINK, NAV_LINKS } from './AppShell'

const nav = (
  <nav className={NAV_LINKS} data-slot="nav-links">
    <NavLink to="/marketplace" className={() => NAV_LINK}>
      Marketplace
    </NavLink>
    <NavLink to="/binder" className={() => NAV_LINK}>
      My Binder
    </NavLink>
    <NavLink to="/friends" className={() => NAV_LINK}>
      Friends
    </NavLink>
    <NavLink to="/trade" className={() => NAV_LINK}>
      Trade
    </NavLink>
    <NavLink to="/leaderboard" className={() => NAV_LINK}>
      🏆 Top Brains
    </NavLink>
  </nav>
)

const toolbar = (
  <>
    <span className="font-bold whitespace-nowrap text-gold tabular-nums" data-slot="coins">
      <span aria-hidden="true">🧠 {meLou.coins.toLocaleString()}</span>
      <span className="sr-only">{meLou.coins.toLocaleString()} braincells</span>
    </span>
    <AlertsBell model={buildAlertsBellModel({ alerts: [unreadSale], open: false, onOpenChange: fn() })} />
    <Button>Log out</Button>
  </>
)

const meta = {
  title: 'Organisms/AppShell',
  component: AppShell,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
  args: {
    children: <PageContainer as="main" id="main" tabIndex={-1}><p>page body</p></PageContainer>,
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
