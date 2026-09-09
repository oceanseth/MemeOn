import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { tierFrames } from '../../.storybook/fixtures'
import { LandingView } from './LandingView'

function invokeRenderedLogin(button: HTMLButtonElement): void {
  const reactPropsKey = Object.keys(button).find((key) => key.startsWith('__reactProps$'))
  if (!reactPropsKey) throw new Error('Rendered login callback is unavailable')
  const props = (button as unknown as Record<string, { onClick?: () => void }>)[reactPropsKey]
  props?.onClick?.()
}

function expectAuthorizationUrl(url: string): void {
  const authorization = new URL(url)
  expect(authorization.origin).toBe('https://masky.example.test')
  expect(authorization.pathname).toBe('/authorize')
  expect(authorization.searchParams.get('response_type')).toBe('code')
  expect(authorization.searchParams.get('client_id')).toBe('memeon-storybook')
  expect(authorization.searchParams.get('redirect_uri')).toBe(`${window.location.origin}/auth/callback`)
  expect(authorization.searchParams.get('scope')).toBe('openid profile')
  expect(authorization.searchParams.get('state')).toBe(sessionStorage.getItem('masky_oauth_state'))
}

const meta = {
  title: 'Views/LandingView',
  component: LandingView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof LandingView>

export default meta
type Story = StoryObj<typeof meta>

export const DelayedFramesLoginErrorAndRetry: Story = {
  loaders: [connectedLoader({
    authenticated: false,
    overrides: {
      'GET /api/frames': async (_request, scenario) => {
        await scenario.waitForRelease('frames')
        return { body: { frames: Object.entries(tierFrames).map(([key, url]) => ({ key, url })) } }
      },
      'GET /api/auth/masky/config': async (_request, scenario) => {
        const attempt = scenario.requests.filter((request) => request.path === '/api/auth/masky/config').length
        if (attempt === 1) {
          await scenario.waitForRelease('first-login')
          return { status: 503, body: { error: 'Masky is unavailable. Try again.' } }
        }
        await scenario.waitForRelease('retry-login')
        return { body: { authorizeUrl: 'https://masky.example.test/authorize', clientId: 'memeon-storybook', scopes: 'openid profile' } }
      },
    },
  })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><LandingView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const login = canvas.getByRole('button', { name: 'Log in with Masky' })
    await userEvent.click(login)
    await waitFor(() => expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/auth/masky/config')).toHaveLength(1))
    await expect(canvas.getByRole('button', { name: 'Redirecting to Masky' })).toBeDisabled()
    invokeRenderedLogin(canvas.getByRole('button', { name: 'Redirecting to Masky' }))
    invokeRenderedLogin(canvas.getByRole('button', { name: 'Redirecting to Masky' }))
    await expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/auth/masky/config')).toHaveLength(1)
    loaded.scenario.release('first-login')
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Masky is unavailable. Try again.')
    await expect(canvas.queryByAltText('Paper frame')).not.toBeInTheDocument()
    loaded.scenario.release('frames')
    await expect(await canvas.findByAltText('Paper frame')).toHaveAttribute('src', tierFrames.paper)
    await expect(canvas.getByRole('alert')).toHaveTextContent('Masky is unavailable. Try again.')
    await userEvent.click(canvas.getByRole('button', { name: 'Log in with Masky' }))
    await waitFor(() => expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/auth/masky/config')).toHaveLength(2))
    await expect(canvas.getByRole('button', { name: 'Redirecting to Masky' })).toBeDisabled()
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
    invokeRenderedLogin(canvas.getByRole('button', { name: 'Redirecting to Masky' }))
    await expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/auth/masky/config')).toHaveLength(2)
    loaded.scenario.release('retry-login')
    await waitFor(() => expect(loaded.scenario.authorizationNavigations).toHaveLength(1))
    expectAuthorizationUrl(loaded.scenario.authorizationNavigations[0])
    await expect(loaded.scenario.unexpected).toEqual([])
  },
}

export const FrameFailureStillReady: Story = {
  loaders: [connectedLoader({ authenticated: false, failures: { 'GET /api/frames': { error: 'frames unavailable' } } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><LandingView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('button', { name: 'Log in with Masky' })).toBeEnabled()
    await expect(canvas.queryByAltText(/frame$/)).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Log in with Masky' }))
    await waitFor(() => expect(loaded.scenario.authorizationNavigations).toHaveLength(1))
    expectAuthorizationUrl(loaded.scenario.authorizationNavigations[0])
  },
}

export const FramesReadyBeforeLoginFailure: Story = {
  loaders: [connectedLoader({ authenticated: false, overrides: {
    'GET /api/frames': async (_request, scenario) => {
      await scenario.waitForRelease('frames-before-login-failure')
      return { body: { frames: Object.entries(tierFrames).map(([key, url]) => ({ key, url })) } }
    },
    'GET /api/auth/masky/config': async (_request, scenario) => {
      await scenario.waitForRelease('login-after-frames')
      return { status: 503, body: { error: 'Masky is unavailable. Try again.' } }
    },
  } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><LandingView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Log in with Masky' }))
    await waitFor(() => expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/auth/masky/config')).toHaveLength(1))
    await expect(canvas.getByRole('button', { name: 'Redirecting to Masky' })).toBeDisabled()
    await expect(canvas.queryByAltText('Paper frame')).not.toBeInTheDocument()
    loaded.scenario.release('frames-before-login-failure')
    await expect(await canvas.findByAltText('Paper frame')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Redirecting to Masky' })).toBeDisabled()
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
    loaded.scenario.release('login-after-frames')
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Masky is unavailable. Try again.')
    await expect(canvas.getByAltText('Paper frame')).toBeInTheDocument()
  },
}
