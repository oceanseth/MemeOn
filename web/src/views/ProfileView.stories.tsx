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
    await expect(binder).toHaveAttribute('aria-controls', 'profile-cards')
    await userEvent.click(binder)
    await expect(binder).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('link', { name: /group-chat silver/ })).toBeInTheDocument()
    await expect(canvasElement.querySelector('#profile-cards')).toHaveAttribute('aria-label', 'Binder memes, 1 card')
    await userEvent.click(canvas.getByRole('button', { name: 'Follow' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Following' })).toHaveAttribute('aria-pressed', 'true'))
    await userEvent.click(canvas.getByRole('button', { name: 'Add friend' }))
    await expect(await canvas.findByText('Request sent')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /friend/i })).toBeNull()
    await expect(canvas.getByRole('button', { name: /Binder/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/users/user-pal/profile').length).toBeGreaterThanOrEqual(3)
  },
}

/** a 500 / offline load is a transport failure, never "this person does not exist" */
export const ReachableLoadError: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/users/user-pal/profile': { error: 'offline' } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><ProfileView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { name: "Couldn't load this profile." })).toBeInTheDocument()
    await expect(canvas.getByRole('alert')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  },
}

/** only a 404 claims the link is dead */
export const MissingProfile: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/users/user-pal/profile': { status: 404, error: 'not found' } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><ProfileView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole('heading', { name: "No one's minted under this link." })).toBeInTheDocument()
  },
}

/** a failed follow says so instead of silently settling back */
export const FollowFailure: Story = {
  loaders: [connectedLoader({ failures: { 'POST /api/users/user-pal/follow': { error: 'nope' } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><ProfileView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Follow' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent("Couldn't update — try again.")
    await expect(canvas.getByRole('button', { name: 'Follow' })).toBeEnabled()
  },
}

export const BinderTab: Story = {
  args: { initialTab: 'binder' }, loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><ProfileView {...args} /></ConnectedStory>,
  play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByRole('button', { name: /Binder/ })).toHaveAttribute('aria-pressed', 'true') },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/users/user-pal/profile': async (_request, scenario) => { await scenario.waitForRelease('profile'); return { body: scenario.profiles.get('user-pal') } } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><ProfileView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Loading profile')); await expect(canvasElement.querySelectorAll('[data-slot="skeleton-card"]').length).toBe(4); loaded.scenario.release('profile'); await expect(await canvas.findByRole('heading', { name: 'pal' })).toBeInTheDocument() },
}
