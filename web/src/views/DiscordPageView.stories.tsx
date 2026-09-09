import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { discordInstallUrl } from '../../.storybook/fixtures'
import { DiscordPageView } from './DiscordPageView'

const meta = {
  title: 'Views/DiscordPageView',
  component: DiscordPageView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/discord']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof DiscordPageView>

export default meta
type Story = StoryObj<typeof meta>

export const ConfiguredInstall: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DiscordPageView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('link', { name: /Add MemeOn to Discord/ })).toHaveAttribute('href', discordInstallUrl)
  },
}

export const Unconfigured: Story = {
  loaders: [connectedLoader({ discordConfigured: false })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DiscordPageView /></ConnectedStory>,
  play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByText(/Almost live/)).toBeInTheDocument() },
}

export const LoadingThenConfigured: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/discord/config': async (_request, scenario) => { await scenario.waitForRelease('discord-config'); return { body: { configured: true, installUrl: discordInstallUrl } } } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DiscordPageView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await expect(canvas.queryByRole('link', { name: /Add MemeOn to Discord/ })).not.toBeInTheDocument(); loaded.scenario.release('discord-config'); await expect(await canvas.findByRole('link', { name: /Add MemeOn to Discord/ })).toBeInTheDocument(); await waitFor(() => expect(loaded.scenario.unexpected).toEqual([])) },
}
