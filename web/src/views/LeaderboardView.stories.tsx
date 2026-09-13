import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { leaderboardRows } from '../../.storybook/fixtures'
import { leaderboardCopy as copy } from '../copy/leaderboard'
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
    await expect(canvas.getByText(copy.row.medals[0])).toBeInTheDocument()
    await expect(canvas.getByText(copy.row.braincells(240))).toBeInTheDocument()
    await expect(loaded.scenario.unexpected).toEqual([])
  },
}

export const InitialFailureShowsError: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/leaderboard': { error: 'offline' } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><LeaderboardView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent(copy.loadError)
    await expect(canvas.getByRole('button', { name: copy.retry })).toBeInTheDocument()
    await expect(canvas.queryByText(copy.empty)).toBeNull()
  },
}

/** The retry path a dropped connection actually takes: error -> loading -> rows. */
export const RetryAfterFailure: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/leaderboard': (() => {
    let attempts = 0
    return async () => (++attempts === 1 ? { status: 503, body: { error: 'offline' } } : { body: { leaders: leaderboardRows } })
  })() } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><LeaderboardView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: copy.retry }))
    await expect(await canvas.findByRole('link', { name: /pal/ })).toBeInTheDocument()
  },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/leaderboard': async (_request, scenario) => { await scenario.waitForRelease('leaders'); return { body: { leaders: leaderboardRows } } } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><LeaderboardView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('[data-slot="skeleton-row"]')).not.toBeNull()); loaded.scenario.release('leaders'); await expect(await canvas.findByRole('link', { name: /pal/ })).toBeInTheDocument() },
}
