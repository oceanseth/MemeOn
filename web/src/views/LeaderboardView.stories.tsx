import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { LeaderboardView } from './LeaderboardView'

const meta = {
  title: 'Views/LeaderboardView',
  component: LeaderboardView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/leaderboard']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof LeaderboardView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
