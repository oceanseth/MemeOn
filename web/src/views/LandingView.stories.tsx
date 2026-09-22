import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  connectedBeforeEach,
  connectedLoader,
  ConnectedStory,
} from '../../.storybook/connected-story'
import { landingCopy as copy } from '../copy/landing'
import { getMaskyOauthState } from '../lib/sessionBus'
import { LandingView } from './LandingView'

function invokeRenderedLogin(button: HTMLButtonElement): void {
  const reactPropsKey = Object.keys(button).find((key) => key.startsWith('__reactProps$'))
  if (!reactPropsKey) throw new Error('Rendered login callback is unavailable')
  const props = (button as unknown as Record<string, { onClick?: (event: MouseEvent) => void }>)[
    reactPropsKey
  ]
  props?.onClick?.(new MouseEvent('click'))
}

function expectAuthorizationUrl(url: string): void {
  const authorization = new URL(url)
  expect(authorization.origin).toBe('https://masky.example.test')
  expect(authorization.pathname).toBe('/authorize')
  expect(authorization.searchParams.get('response_type')).toBe('code')
  expect(authorization.searchParams.get('client_id')).toBe('memeon-storybook')
  expect(authorization.searchParams.get('redirect_uri')).toBe(
    `${window.location.origin}/auth/callback`,
  )
  expect(authorization.searchParams.get('scope')).toBe('openid profile')
  expect(authorization.searchParams.get('state')).toBe(getMaskyOauthState())
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

export const LoginErrorAndRetry: Story = {
  loaders: [
    connectedLoader({
      authenticated: false,
      overrides: {
        'GET /api/auth/masky/config': async (_request, scenario) => {
          const attempt = scenario.requests.filter(
            (request) => request.path === '/api/auth/masky/config',
          ).length
          if (attempt === 1) {
            await scenario.waitForRelease('first-login')
            return { status: 503, body: { error: 'Masky is unavailable. Try again.' } }
          }
          await scenario.waitForRelease('retry-login')
          return {
            body: {
              authorizeUrl: 'https://masky.example.test/authorize',
              clientId: 'memeon-storybook',
              scopes: 'openid profile',
            },
          }
        },
      },
    }),
  ],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => (
    <ConnectedStory scenario={loaded.scenario}>
      <LandingView />
    </ConnectedStory>
  ),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(canvasElement.querySelectorAll('[data-slot="hero-card"]')).toHaveLength(7)
    await expect(
      loaded.scenario.requests.filter(
        (request: { path: string }) => request.path === '/api/frames',
      ),
    ).toHaveLength(0)

    await userEvent.click(canvas.getByRole('button', { name: copy.login.name }))
    await waitFor(() =>
      expect(
        loaded.scenario.requests.filter(
          (request: { path: string }) => request.path === '/api/auth/masky/config',
        ),
      ).toHaveLength(1),
    )
    invokeRenderedLogin(canvas.getByRole('button', { name: copy.login.busyName }))
    invokeRenderedLogin(canvas.getByRole('button', { name: copy.login.busyName }))
    await expect(
      loaded.scenario.requests.filter(
        (request: { path: string }) => request.path === '/api/auth/masky/config',
      ),
    ).toHaveLength(1)

    loaded.scenario.release('first-login')
    await expect(await canvas.findByRole('alert')).toHaveTextContent(copy.errors.login)
    await userEvent.click(canvas.getByRole('button', { name: copy.login.name }))
    await waitFor(() =>
      expect(
        loaded.scenario.requests.filter(
          (request: { path: string }) => request.path === '/api/auth/masky/config',
        ),
      ).toHaveLength(2),
    )
    loaded.scenario.release('retry-login')
    await waitFor(() => expect(loaded.scenario.authorizationNavigations).toHaveLength(1))
    expectAuthorizationUrl(loaded.scenario.authorizationNavigations[0])
    await expect(loaded.scenario.unexpected).toEqual([])
  },
}

export const CardsReadyWithoutFrameApi: Story = {
  loaders: [connectedLoader({ authenticated: false })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => (
    <ConnectedStory scenario={loaded.scenario}>
      <LandingView />
    </ConnectedStory>
  ),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('button', { name: copy.login.name })).toBeEnabled()
    await expect(canvasElement.querySelectorAll('[data-slot="hero-card"]')).toHaveLength(7)
    await expect(canvasElement.querySelector('[data-slot="landing-tiers"]')).toBeNull()
    await expect(
      loaded.scenario.requests.filter(
        (request: { path: string }) => request.path === '/api/frames',
      ),
    ).toHaveLength(0)
    await userEvent.click(canvas.getByRole('button', { name: copy.login.name }))
    await waitFor(() => expect(loaded.scenario.authorizationNavigations).toHaveLength(1))
    expectAuthorizationUrl(loaded.scenario.authorizationNavigations[0])
  },
}
