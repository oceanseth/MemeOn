import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createActor } from 'xstate'
import { meLou, unreadSale } from '../../.storybook/fixtures'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { createRequestGuard } from '../../.storybook/request-accounting'
import { clearSession, maskyAccessToken, sessionToken, setMaskyAccessToken, setSessionToken } from '../lib/api'
import { authMachine } from '../stores/authMachine'
import { createStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { AppView } from './AppView'

const meta = {
  title: 'Views/AppView',
  component: AppView,
  tags: ['!autodocs'],
  decorators: [
    (Story, context) => (
      <MemoryRouter initialEntries={context.parameters.initialEntries ?? ['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AppView>

export default meta
type Story = StoryObj<typeof meta>

export const PublicLandingRoute: Story = {
  loaders: [connectedLoader({ authenticated: false })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><AppView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('button', { name: 'Log in with Masky' })).toBeInTheDocument()
    await expect(canvas.queryByRole('link', { name: 'My Binder' })).not.toBeInTheDocument()
    await expect(loaded.scenario.stores.auth.snapshot.matches('unauthenticated')).toBe(true)
    await expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/me')).toHaveLength(0)
    /* the bypass block has to land on the route's own <main>, not on a story-supplied wrapper */
    await expect(canvas.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
    const skipTarget = canvasElement.querySelector<HTMLElement>('#main')
    await expect(skipTarget?.tagName).toBe('MAIN')
    skipTarget?.focus()
    await expect(skipTarget).toHaveFocus()
  },
}

const authSetup: Story = {
  parameters: { initialEntries: ['/developers'] },
  beforeEach: async ({ loaded, parameters }) => {
    // the guarded routes are code-split: warm their chunks so a play function sees the route, not the spinner
    await Promise.all([import('./CreateMemeView'), import('./DevelopersView')])
    const originalFetch = window.fetch
    const previousSession = sessionToken()
    const previousMasky = maskyAccessToken()
    setSessionToken('story-session')
    setMaskyAccessToken('story-masky-token')
    window.fetch = async (input, init) => {
      const path = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      switch (path) {
        case '/api/me': {
          loaded.accountRequest.count += 1
          if ((parameters.deferInitialAuth && loaded.accountRequest.count === 1) ||
              (parameters.deferRefresh && loaded.accountRequest.count === 2)) {
            return loaded.accountRequest.response
          }
          return Response.json(meLou)
        }
        case '/api/alerts': return Response.json({ alerts: parameters.unreadAlerts ? [unreadSale] : [] })
        case '/api/alerts/read': return Response.json({})
        case '/api/onboarding': return Response.json({ steps: [] })
        case '/api/developers/keys': return Response.json({ keys: [] })
        case '/api/frames': return Response.json({ frames: [] })
        default: return loaded.requestGuard.record(init?.method ?? 'GET', path)
      }
    }
    loaded.authStores.retain()
    if (!parameters.deferInitialAuth) await loaded.authStores.auth.refresh()
    return () => {
      loaded.authStores.dispose()
      window.fetch = originalFetch
      clearSession()
      if (previousSession) setSessionToken(previousSession)
      if (previousMasky) setMaskyAccessToken(previousMasky)
    }
  },
  loaders: [() => {
    const authActor = createActor(authMachine.provide({
      actions: { clearSessionAndFirebase: clearSession },
    }))
    const authStores = createStores(authActor)
    let resolve!: (response: Response) => void
    const response = new Promise<Response>((done) => { resolve = done })
    return { authStores, accountRequest: { count: 0, response, resolve }, requestGuard: createRequestGuard() }
  }],
  render: (_args, { loaded }) => (
    <StoresProvider stores={loaded.authStores}>
      <AppView />
    </StoresProvider>
  ),
}

export const LogoutClearsProtectedRoute: Story = {
  ...authSetup,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    // the guarded views are code-split, so the route's chunk lands after the shell
    await expect(await canvas.findByRole('heading', { name: /Developers/ })).toBeInTheDocument()
    // the guarded routes carry the same bypass target as the public ones
    await expect(canvasElement.querySelector('main#main[tabindex="-1"]')).not.toBeNull()
    // Direct store logout exercises RequireAuth without the shell's navigation callback.
    loaded.authStores.auth.logout()
    await waitFor(() => {
      expect(canvas.queryByRole('heading', { name: /Developers/ })).not.toBeInTheDocument()
      expect(canvas.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
      expect(canvas.getByRole('button', { name: /Log in with Masky/ })).toBeInTheDocument()
    })
    await expect(sessionToken()).toBeNull()
    await expect(maskyAccessToken()).toBeNull()
  },
}

export const LogoutButtonClearsNavigation: Story = {
  ...authSetup,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Log out' }))
    await waitFor(() => {
      expect(canvas.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
      expect(canvas.queryByRole('link', { name: 'My Binder' })).not.toBeInTheDocument()
      expect(canvas.getByRole('button', { name: /Log in with Masky/ })).toBeInTheDocument()
    })
    await expect(sessionToken()).toBeNull()
    await expect(maskyAccessToken()).toBeNull()
  },
}

export const InitialAuthenticationGatesMint: Story = {
  ...authSetup,
  parameters: { initialEntries: ['/binder/new'], deferInitialAuth: true },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('textbox', { name: 'Title' })).not.toBeInTheDocument()
    await expect(loaded.authStores.auth.loading).toBe(true)

    const pending = loaded.authStores.auth.refresh()
    void pending.catch(() => {})
    await expect(loaded.accountRequest.count).toBe(1)
    await expect(loaded.authStores.auth.loading).toBe(true)
    await expect(canvas.queryByRole('textbox', { name: 'Title' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /Log in with Masky/ })).not.toBeInTheDocument()

    loaded.accountRequest.resolve(Response.json(meLou))
    await pending
    await expect(await canvas.findByRole('textbox', { name: 'Title' })).toHaveValue('')
  },
}

export const AccountRefreshPreservesMintDraft: Story = {
  ...authSetup,
  parameters: { initialEntries: ['/binder/new'], deferRefresh: true, unreadAlerts: true },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const title = await canvas.findByRole('textbox', { name: 'Title' })
    const prompt = canvas.getByRole('textbox', { name: 'Prompt' })
    await userEvent.type(title, 'draft survives')
    await userEvent.type(prompt, 'a cat in a spacesuit')
    // the bell now names its own unread count, so match the stem
    const alerts = canvas.getByRole('button', { name: /^Alerts/ })
    await waitFor(() => expect(alerts).toHaveTextContent('1'))
    await userEvent.click(alerts)

    await waitFor(() => expect(loaded.accountRequest.count).toBe(2))
    await expect(loaded.authStores.auth.snapshot.matches('loading')).toBe(true)
    await expect(canvas.getByRole('textbox', { name: 'Title' })).toBe(title)
    await expect(canvas.getByRole('textbox', { name: 'Prompt' })).toBe(prompt)
    await expect(title).toHaveValue('draft survives')
    await expect(prompt).toHaveValue('a cat in a spacesuit')
    await userEvent.type(title, '!')

    loaded.accountRequest.resolve(Response.json({ ...meLou, coins: meLou.coins + 1, unreadAlerts: 0 }))
    await waitFor(() => expect(loaded.authStores.auth.user.coins).toBe(meLou.coins + 1))
    await expect(canvas.getByRole('textbox', { name: 'Title' })).toBe(title)
    await expect(canvas.getByRole('textbox', { name: 'Prompt' })).toBe(prompt)
    await expect(title).toHaveValue('draft survives!')
    await expect(prompt).toHaveValue('a cat in a spacesuit')
  },
}

export const AccountRefreshFailurePreservesMintDraft: Story = {
  ...authSetup,
  parameters: { initialEntries: ['/binder/new'], deferRefresh: true, unreadAlerts: true },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const title = await canvas.findByRole('textbox', { name: 'Title' })
    const prompt = canvas.getByRole('textbox', { name: 'Prompt' })
    await userEvent.type(title, 'draft survives')
    await userEvent.type(prompt, 'a cat in a spacesuit')
    // the bell now names its own unread count, so match the stem
    const alerts = canvas.getByRole('button', { name: /^Alerts/ })
    await waitFor(() => expect(alerts).toHaveTextContent('1'))
    await userEvent.click(alerts)
    await waitFor(() => expect(loaded.accountRequest.count).toBe(2))

    loaded.accountRequest.resolve(Response.json({ error: 'account unavailable' }, { status: 503 }))
    await waitFor(() => expect(loaded.authStores.auth.snapshot.hasTag('settled')).toBe(true))
    await expect(canvas.getByRole('textbox', { name: 'Title' })).toBe(title)
    await expect(canvas.getByRole('textbox', { name: 'Prompt' })).toBe(prompt)
    await expect(title).toHaveValue('draft survives')
    await expect(prompt).toHaveValue('a cat in a spacesuit')
    await expect(loaded.authStores.auth.user).toEqual(meLou)
    await expect(loaded.authStores.auth.error).toBe('account unavailable')
    await userEvent.type(title, '!')

    await loaded.authStores.auth.refresh()
    await expect(loaded.authStores.auth.error).toBeNull()
    await expect(canvas.getByRole('textbox', { name: 'Title' })).toBe(title)
    await expect(canvas.getByRole('textbox', { name: 'Prompt' })).toBe(prompt)
    await expect(title).toHaveValue('draft survives!')
    await expect(prompt).toHaveValue('a cat in a spacesuit')
  },
}
