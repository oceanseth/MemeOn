import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { leaderboardRows } from '../../.storybook/fixtures'
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

export const RowsAndLinks: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><LeaderboardView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('link', { name: /pal/ })).toHaveAttribute('href', '/u/user-pal')
    await expect(canvas.getByText('🥇')).toBeInTheDocument()
    await expect(canvas.getByText('🧠 240')).toBeInTheDocument()
    await expect(loaded.scenario.unexpected).toEqual([])
  },
}

export const InitialFailureIsEmpty: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/leaderboard': { error: 'offline' } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><LeaderboardView /></ConnectedStory>,
  play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByText(/throne is empty/i)).toBeInTheDocument() },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/leaderboard': async (_request, scenario) => { await scenario.waitForRelease('leaders'); return { body: { leaders: leaderboardRows } } } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><LeaderboardView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('.spin')).not.toBeNull()); loaded.scenario.release('leaders'); await expect(await canvas.findByRole('link', { name: /pal/ })).toBeInTheDocument() },
}
