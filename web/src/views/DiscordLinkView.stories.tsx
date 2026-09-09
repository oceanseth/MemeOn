import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { DiscordLinkView } from './DiscordLinkView'

const meta = {
  title: 'Views/DiscordLinkView',
  component: DiscordLinkView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/discord/link?token=latest-story-token']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof DiscordLinkView>

export default meta
type Story = StoryObj<typeof meta>

export const PendingAuthUsesLatestTokenOnce: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DiscordLinkView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    await expect(await within(canvasElement).findByRole('heading', { name: /Connected/ })).toBeInTheDocument()
    await waitFor(() => expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/discord/link')).toHaveLength(1))
    await expect(loaded.scenario.requests.find((request: { path: string }) => request.path === '/api/discord/link')?.body).toEqual({ token: 'latest-story-token' })
  },
}

export const LinkFailure: Story = {
  loaders: [connectedLoader({ failures: { 'POST /api/discord/link': { error: 'link expired', status: 410 } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DiscordLinkView /></ConnectedStory>,
  play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByText('link expired')).toBeInTheDocument() },
}

export const WorkingThenDone: Story = {
  loaders: [connectedLoader({ overrides: { 'POST /api/discord/link': async (_request, scenario) => { await scenario.waitForRelease('discord-link'); return { body: {} } } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DiscordLinkView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await expect(await canvas.findByText('Connecting your Discord…')).toBeInTheDocument(); loaded.scenario.release('discord-link'); await expect(await canvas.findByRole('heading', { name: /Connected/ })).toBeInTheDocument() },
}
