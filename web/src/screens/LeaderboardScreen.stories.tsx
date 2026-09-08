import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { friendAccepted, meLou } from '../../.storybook/fixtures'
import type { LeaderboardScreenModel } from '../hooks/useLeaderboardScreen'
import { LeaderboardScreen } from './LeaderboardScreen'

const leaderLou = {
  sub: meLou.sub,
  name: meLou.name,
  picture: meLou.picture,
  braincells: meLou.coins,
  portfolioValue: meLou.portfolioValue,
  collectionSize: meLou.collectionSize,
}

const leaderPal = {
  sub: friendAccepted.sub,
  name: friendAccepted.name,
  picture: friendAccepted.picture,
  braincells: 40,
  portfolioValue: friendAccepted.portfolioValue,
  collectionSize: friendAccepted.collectionSize,
}

const empty: LeaderboardScreenModel = {
  phase: 'empty',
  leaders: [],
  showLoading: false,
  showEmpty: true,
  emptyMessage: "Nobody's earned a braincell yet. The throne is empty.",
  showList: false,
}

const meta = {
  title: 'Screens/LeaderboardScreen',
  component: LeaderboardScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof LeaderboardScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: { phase: 'loading', showEmpty: false, showLoading: true },
}

export const Empty: Story = {}

export const Error: Story = {
  args: {
    phase: 'error',
    emptyMessage: 'could not load leaderboard',
  },
}

export const Ready: Story = {
  args: {
    phase: 'ready',
    showEmpty: false,
    showList: true,
    leaders: [leaderLou, leaderPal],
  },
}
