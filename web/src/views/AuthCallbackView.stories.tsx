import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  connectedBeforeEach,
  connectedLoader,
  ConnectedStory,
} from '../../.storybook/connected-story'
import { meLou } from '../../.storybook/fixtures'
import { authStatusCopy } from '../copy/authStatus'
import { inviteCopy } from '../copy/invite'
import { sharedCopy } from '../copy/shared'
import { sessionToken } from '../lib/api'
import { setInviteFrom, setMaskyOauthState, setPostLogin } from '../lib/sessionBus'
import { AuthCallbackView } from './AuthCallbackView'

const meta = {
  title: 'Views/AuthCallbackView',
  component: AuthCallbackView,
  tags: ['!autodocs'],
} satisfies Meta<typeof AuthCallbackView>

export default meta
type Story = StoryObj<typeof meta>

const MASKY_STATE = 'oauth-state'
const INVITER = 'user-pal'
const CALLBACK_SEARCH = `?code=single-use-code&state=${MASKY_STATE}`

function CurrentRoute() {
  return <output aria-label="Current route">{useLocation().pathname}</output>
}

const at =
  (search: string): Decorator =>
  (Story) => (
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <Story />
    </MemoryRouter>
  )

/** Observable destinations so a swallowed accept cannot hide behind /friends. */
const aroundCallback: Decorator = (Story) => (
  <MemoryRouter initialEntries={[`/auth/callback${CALLBACK_SEARCH}`]}>
    <Routes>
      <Route path="/auth/callback" element={<Story />} />
      <Route path="/friends" element={<p>Friends</p>} />
      <Route path="/marketplace" element={<p>Marketplace</p>} />
      <Route path="/discord/link" element={<p>Discord link</p>} />
    </Routes>
    <CurrentRoute />
  </MemoryRouter>
)

function maskyExchange(_request: unknown, scenario: { user: typeof meLou | null }) {
  scenario.user = meLou
  return {
    body: {
      sessionToken: 'story-session-after-masky',
      maskyAccessToken: 'story-masky-after-masky',
      firebaseToken: null,
      profile: {
        sub: meLou.sub,
        name: meLou.name,
        picture: meLou.picture,
        coins: meLou.coins,
      },
    },
  }
}

async function seedInviteAfterClear(
  context: Parameters<typeof connectedBeforeEach>[0],
  extra?: () => void,
) {
  const cleanup = await connectedBeforeEach(context)
  setMaskyOauthState(MASKY_STATE)
  setInviteFrom(INVITER)
  extra?.()
  return cleanup
}

/** Masky sent the visitor back without a code: the provider's error is the message. */
export const ProviderDenied: Story = {
  decorators: [at('?error=access_denied')],
  loaders: [connectedLoader({ authenticated: false })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => (
    <ConnectedStory scenario={loaded.scenario}>
      <AuthCallbackView />
    </ConnectedStory>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', {
        name: authStatusCopy.callback.failed.title,
      }),
    ).toBeInTheDocument()
    await expect(canvas.getByRole('alert')).toHaveTextContent('access_denied')
    await expect(canvasElement.querySelector('[data-slot="auth-ring"]')).toBeNull()
    await expect(document.title).toBe(
      sharedCopy.documentTitle(authStatusCopy.callback.documentTitle),
    )
  },
}

/** A code arrived but the stored OAuth state is gone (new tab, cleared storage): no exchange is attempted. */
export const StateMismatchThenRetry: Story = {
  decorators: [at('?code=single-use-code&state=stale')],
  loaders: [connectedLoader({ authenticated: false })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => (
    <ConnectedStory scenario={loaded.scenario}>
      <AuthCallbackView />
    </ConnectedStory>
  ),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent('OAuth state mismatch')
    await expect(
      loaded.scenario.requests.filter(
        (request: { path: string }) => request.path === '/api/auth/masky/callback',
      ),
    ).toHaveLength(0)
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(loaded.scenario.authorizationNavigations).toHaveLength(1))
    expect(loaded.scenario.authorizationNavigations[0]).toMatch(
      /^https:\/\/masky\.example\.test\/authorize\?/,
    )
    await expect(canvas.getByRole('link', { name: 'Back to MemeOn' })).toHaveAttribute('href', '/')
  },
}

/** Masky ok, accept 404, stay on the callback; Try again re-POSTs accept and then lands on Friends. */
export const InviteAcceptFailedStaysOnCallback: Story = {
  decorators: [aroundCallback],
  loaders: [
    connectedLoader({
      authenticated: false,
      overrides: {
        'POST /api/auth/masky/callback': maskyExchange,
        'POST /api/invites/accept': (_request, scenario) => {
          const attempts = scenario.requests.filter(
            (request) => request.path === '/api/invites/accept',
          ).length
          if (attempts <= 1) return { status: 404, body: { error: 'inviter not found' } }
          return { body: {} }
        },
      },
    }),
  ],
  beforeEach: async (context) => seedInviteAfterClear(context),
  render: (_args, { loaded }) => (
    <ConnectedStory scenario={loaded.scenario}>
      <AuthCallbackView />
    </ConnectedStory>
  ),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByRole('heading', {
        name: authStatusCopy.callback.inviteFailed.title,
      }),
    ).toBeInTheDocument()
    await expect(
      canvas.queryByRole('heading', {
        name: authStatusCopy.callback.failed.title,
      }),
    ).not.toBeInTheDocument()
    await expect(canvas.getByRole('alert')).toHaveTextContent(inviteCopy.errors.accept)
    await expect(canvas.getByRole('alert')).not.toHaveTextContent('inviter not found')
    await expect(canvasElement.querySelector('[data-slot="auth-status"]')).toHaveAttribute(
      'data-phase',
      'error',
    )
    await expect(canvas.getByRole('status', { name: 'Current route' })).toHaveTextContent(
      '/auth/callback',
    )
    await expect(canvas.queryByText('Friends')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Discord link')).not.toBeInTheDocument()
    await expect(sessionToken()).toBeTruthy()
    await expect(loaded.scenario.stores.auth.user?.sub).toBe(meLou.sub)
    await expect(loaded.scenario.authorizationNavigations).toEqual([])
    const firstAccept = loaded.scenario.requests.filter(
      (request: { path: string }) => request.path === '/api/invites/accept',
    )
    await expect(firstAccept).toHaveLength(1)
    await expect(firstAccept[0]?.body).toEqual({ inviterId: INVITER })
    await userEvent.click(canvas.getByRole('button', { name: authStatusCopy.callback.retry }))
    await expect(loaded.scenario.authorizationNavigations).toEqual([])
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Current route' })).toHaveTextContent('/friends'),
    )
    await expect(canvas.getByText('Friends')).toBeInTheDocument()
    const accepts = loaded.scenario.requests.filter(
      (request: { path: string }) => request.path === '/api/invites/accept',
    )
    await expect(accepts).toHaveLength(2)
    await expect(accepts.map((request: { body: unknown }) => request.body)).toEqual([
      { inviterId: INVITER },
      { inviterId: INVITER },
    ])
    await expect(loaded.scenario.authorizationNavigations).toEqual([])
  },
}

/** Masky ok + accept 200 `{ already: true }` is success and goes to Friends. */
export const InviteAcceptSucceedsToFriends: Story = {
  decorators: [aroundCallback],
  loaders: [
    connectedLoader({
      authenticated: false,
      overrides: {
        'POST /api/auth/masky/callback': maskyExchange,
        'POST /api/invites/accept': () => ({ body: { already: true } }),
      },
    }),
  ],
  beforeEach: async (context) => seedInviteAfterClear(context),
  render: (_args, { loaded }) => (
    <ConnectedStory scenario={loaded.scenario}>
      <AuthCallbackView />
    </ConnectedStory>
  ),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Current route' })).toHaveTextContent('/friends'),
    )
    await expect(canvas.getByText('Friends')).toBeInTheDocument()
    await expect(
      canvas.queryByRole('heading', {
        name: authStatusCopy.callback.inviteFailed.title,
      }),
    ).not.toBeInTheDocument()
    await expect(
      loaded.scenario.requests.find(
        (request: { path: string }) => request.path === '/api/invites/accept',
      )?.body,
    ).toEqual({ inviterId: INVITER })
  },
}

/** Masky ok + accept 200 `{ self: true }` still honors the already-read post-login path. */
export const InviteAcceptSucceedsToPostLogin: Story = {
  decorators: [aroundCallback],
  loaders: [
    connectedLoader({
      authenticated: false,
      overrides: {
        'POST /api/auth/masky/callback': maskyExchange,
        'POST /api/invites/accept': () => ({ body: { self: true } }),
      },
    }),
  ],
  beforeEach: async (context) => seedInviteAfterClear(context, () => setPostLogin('/discord/link')),
  render: (_args, { loaded }) => (
    <ConnectedStory scenario={loaded.scenario}>
      <AuthCallbackView />
    </ConnectedStory>
  ),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Current route' })).toHaveTextContent(
        '/discord/link',
      ),
    )
    await expect(canvas.getByText('Discord link')).toBeInTheDocument()
    await expect(canvas.queryByText('Friends')).not.toBeInTheDocument()
    await expect(
      loaded.scenario.requests.find(
        (request: { path: string }) => request.path === '/api/invites/accept',
      )?.body,
    ).toEqual({ inviterId: INVITER })
  },
}
