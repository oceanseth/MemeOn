import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { discordInstallUrl } from '../../.storybook/fixtures'
import { discordPageCopy as copy } from '../copy/discordPage'
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
    await expect(await within(canvasElement).findByRole('link', { name: copy.cta.label })).toHaveAttribute('href', discordInstallUrl)
  },
}

export const Unconfigured: Story = {
  loaders: [connectedLoader({ discordConfigured: false })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DiscordPageView /></ConnectedStory>,
  play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByText(copy.pending)).toBeInTheDocument() },
}

export const LoadingThenConfigured: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/discord/config': async (_request, scenario) => { await scenario.waitForRelease('discord-config'); return { body: { configured: true, installUrl: discordInstallUrl } } } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DiscordPageView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await expect(canvas.queryByRole('link', { name: copy.cta.label })).not.toBeInTheDocument(); await expect(canvas.getByText(copy.busy)).toBeInTheDocument(); loaded.scenario.release('discord-config'); await expect(await canvas.findByRole('link', { name: copy.cta.label })).toBeInTheDocument(); await waitFor(() => expect(loaded.scenario.unexpected).toEqual([])) },
}

export const ConfigUnreachable: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/discord/config': { error: 'boom', status: 500 } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DiscordPageView /></ConnectedStory>,
  play: async ({ canvasElement }) => { const canvas = within(canvasElement); await expect(await canvas.findByText(copy.error)).toBeInTheDocument(); await expect(canvas.queryByText(copy.pending)).not.toBeInTheDocument() },
}
