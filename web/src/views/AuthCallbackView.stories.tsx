import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { AuthCallbackView } from './AuthCallbackView'

const meta = {
  title: 'Views/AuthCallbackView',
  component: AuthCallbackView,
  tags: ['!autodocs'],
} satisfies Meta<typeof AuthCallbackView>

export default meta
type Story = StoryObj<typeof meta>

const at = (search: string): Decorator => (Story) => (
  <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
    <Story />
  </MemoryRouter>
)

/** Masky sent the visitor back without a code: the provider's error is the message. */
export const ProviderDenied: Story = {
  decorators: [at('?error=access_denied')],
  loaders: [connectedLoader({ authenticated: false })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><AuthCallbackView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { name: 'Masky login didn’t finish' })).toBeInTheDocument()
    await expect(canvas.getByRole('alert')).toHaveTextContent('access_denied')
    await expect(canvasElement.querySelector('[data-slot="auth-ring"]')).toBeNull()
    await expect(document.title).toBe('Completing Masky login — MemeOn')
  },
}

/** A code arrived but the stored OAuth state is gone (new tab, cleared storage): no exchange is attempted. */
export const StateMismatchThenRetry: Story = {
  decorators: [at('?code=single-use-code&state=stale')],
  loaders: [connectedLoader({ authenticated: false })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><AuthCallbackView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent('OAuth state mismatch')
    await expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/auth/masky/callback')).toHaveLength(0)
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(loaded.scenario.authorizationNavigations).toHaveLength(1))
    expect(loaded.scenario.authorizationNavigations[0]).toMatch(/^https:\/\/masky\.example\.test\/authorize\?/)
    await expect(canvas.getByRole('link', { name: 'Back to MemeOn' })).toHaveAttribute('href', '/')
  },
}
