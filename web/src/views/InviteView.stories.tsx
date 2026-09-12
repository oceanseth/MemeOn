import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { InviteView } from './InviteView'

const meta = {
  title: 'Views/InviteView',
  component: InviteView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/invite/user-pal']}>
        <Routes>
          <Route path="/invite/:sub" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof InviteView>

export default meta
type Story = StoryObj<typeof meta>

export const ReadyAndAccept: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><InviteView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { name: /pal invited you/ })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /Accept & befriend pal/ }))
    await waitFor(() => expect(loaded.scenario.requests.find((request: { path: string }) => request.path === '/api/invites/accept')?.body).toEqual({ inviterId: 'user-pal' }))
  },
}

export const FatalLoadError: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/invite/user-pal': { error: 'expired', status: 410 } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><InviteView /></ConnectedStory>,
  play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByText(/invalid or expired/)).toBeInTheDocument() },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/invite/user-pal': async (_request, scenario) => { await scenario.waitForRelease('invite'); return { body: scenario.inviteData.get('user-pal') } } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><InviteView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('[data-slot="spinner"]')).not.toBeNull()); loaded.scenario.release('invite'); await expect(await canvas.findByRole('heading', { name: /pal invited you/ })).toBeInTheDocument() },
}

export const AcceptFailureReturnsToReady: Story = {
  loaders: [connectedLoader({ failures: { 'POST /api/invites/accept': { error: 'invite already used', status: 409 } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><InviteView /></ConnectedStory>,
  play: async ({ canvasElement }) => { const canvas = within(canvasElement); await userEvent.click(await canvas.findByRole('button', { name: /Accept & befriend pal/ })); await expect(await canvas.findByRole('alert')).toHaveTextContent(/Couldn't accept this invite/); await expect(canvas.getByRole('button', { name: /Accept & befriend pal/ })).not.toHaveAttribute('aria-disabled') },
}
