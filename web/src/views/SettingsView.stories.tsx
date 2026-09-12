import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { SettingsView } from './SettingsView'

const meta = {
  title: 'Views/SettingsView',
  component: SettingsView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/settings']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof SettingsView>

export default meta
type Story = StoryObj<typeof meta>

/** The account card reads the signed-in avatar; nothing on this route fetches. */
export const ReadsTheSignedInAvatar: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><SettingsView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('🧠 lou')).toBeInTheDocument()
    await expect(canvas.getByText('Masky avatar')).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'Connect Discord' })).toHaveAttribute('href', '/discord')
    // a settings page that fetched would be a second source of truth for the account
    await expect(loaded.scenario.requests.map((request: { path: string }) => request.path)).toEqual(['/api/me'])
  },
}

/** Appearance is the theme store: the press persists and repaints `<html>`, not a local copy. */
export const AppearanceWritesTheThemeStore: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><SettingsView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const group = await within(canvasElement).findByRole('group', { name: 'Theme' })
    await userEvent.click(within(group).getByRole('button', { name: /Dark/ }))
    await waitFor(() => expect(loaded.scenario.stores.theme.preference).toBe('dark'))
    await expect(document.documentElement.dataset.theme).toBe('dark')
    await userEvent.click(within(group).getByRole('button', { name: /Light/ }))
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'))
  },
}

/** Log out is the shell's logout: the guarded account card goes with the session. */
export const LogOutClearsTheAccountCard: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><SettingsView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Log out' }))
    await waitFor(() => expect(canvas.queryByText('🧠 lou')).not.toBeInTheDocument())
    // the rest of the page survives: appearance is a device preference, not an account one
    await expect(canvas.getByRole('heading', { name: 'Appearance' })).toBeInTheDocument()
  },
}
