import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { leaderboardRows } from '../../.storybook/fixtures'
import { buildLeaderboardRowModel, type LeaderboardScreenModel } from '../hooks/useLeaderboardScreen'
import { LeaderboardScreen } from './LeaderboardScreen'

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
  name: 'Error (prop fixture only)',
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
    leaders: leaderboardRows.map(buildLeaderboardRowModel),
  },
}
