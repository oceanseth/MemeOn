import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { ProfileView } from './ProfileView'

const meta = {
  title: 'Views/ProfileView',
  component: ProfileView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/u/user-pal']}>
        <Routes><Route path="/u/:sub" element={<Story />} /></Routes>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof ProfileView>

export default meta
type Story = StoryObj<typeof meta>

export const TabsFollowAndFriend: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><ProfileView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { name: 'pal' })).toBeInTheDocument()
    const binder = canvas.getByRole('button', { name: /Binder \(1\)/ })
    await userEvent.click(binder)
    await expect(binder).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('link', { name: /group-chat silver/ })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '☆ Follow' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: '★ Following' })).toHaveAttribute('aria-pressed', 'true'))
    await userEvent.click(canvas.getByRole('button', { name: '👋 Add friend' }))
    await expect(await canvas.findByRole('button', { name: '⏳ Requested' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: /Binder/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/users/user-pal/profile').length).toBeGreaterThanOrEqual(3)
  },
}

export const ReachableLoadError: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/users/user-pal/profile': { error: 'offline' } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><ProfileView /></ConnectedStory>,
  play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByText('profile not found')).toBeInTheDocument() },
}

export const BinderTab: Story = {
  args: { initialTab: 'binder' }, loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><ProfileView {...args} /></ConnectedStory>,
  play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByRole('button', { name: /Binder/ })).toHaveAttribute('aria-pressed', 'true') },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/users/user-pal/profile': async (_request, scenario) => { await scenario.waitForRelease('profile'); return { body: scenario.profiles.get('user-pal') } } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><ProfileView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('.spin')).not.toBeNull()); loaded.scenario.release('profile'); await expect(await canvas.findByRole('heading', { name: 'pal' })).toBeInTheDocument() },
}
