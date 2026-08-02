import type { Meta, StoryObj } from '@storybook/react-vite'
import { Layout } from './Layout'
import { AlertsBell } from './AlertsBell'
import { QuestBar } from './QuestBar'
import { MemeCard } from './MemeCard'
import { ALERTS, LADDER, QUESTS, USER, art } from './fixtures'

const meta = {
  title: 'Chrome/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'App chrome: topbar, quest strip slot, page content, footer. `alerts` and `quests` are slots so the chrome never depends on data-fetching containers.',
      },
    },
  },
} satisfies Meta<typeof Layout>

export default meta
type Story = StoryObj<typeof meta>

const noop = () => {}
const brand = art('#ff9af5', '#7fd4ff', '🧠')

const Page = () => (
  <div className="container">
    <div className="page-head">
      <h2 className="section-title">Marketplace</h2>
      <span className="section-sub">Shares currently for sale</span>
    </div>
    <div className="card-grid">
      {LADDER.slice(0, 4).map((m) => (
        <MemeCard key={m.id} meme={m} />
      ))}
    </div>
  </div>
)

/** Signed in: nav, braincell balance, alerts and avatar in the topbar. */
export const SignedIn: Story = {
  args: {
    user: USER,
    logoSrc: brand,
    onLogout: noop,
    alerts: <AlertsBell alerts={ALERTS} open={false} onToggle={noop} onDismiss={noop} />,
    children: <Page />,
  },
}

/** Signed out: no nav, no user controls — just the brand and Discord link. */
export const SignedOut: Story = {
  args: { user: null, logoSrc: brand, children: <Page /> },
}

/** A new account, with the onboarding quest strip filling the `quests` slot. */
export const WithQuestBar: Story = {
  args: {
    user: USER,
    logoSrc: brand,
    onLogout: noop,
    alerts: <AlertsBell alerts={ALERTS} open={false} onToggle={noop} onDismiss={noop} />,
    quests: (
      <QuestBar steps={QUESTS} brandImageSrc={brand} onClaimPack={noop} onDismissPack={noop} />
    ),
    children: <Page />,
  },
}

/** A user with no avatar set — the topbar simply omits it. */
export const NoAvatar: Story = {
  args: {
    user: { ...USER, picture: null },
    logoSrc: brand,
    onLogout: noop,
    alerts: <AlertsBell alerts={[]} open={false} onToggle={noop} onDismiss={noop} />,
    children: <Page />,
  },
}
