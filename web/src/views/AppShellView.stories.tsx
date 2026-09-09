import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createActor, fromPromise } from 'xstate'
import { meLou, paperMeme, questStepsFresh, questStepsPackDone, unreadFriend, unreadSale } from '../../.storybook/fixtures'
import { createRequestGuard } from '../../.storybook/request-accounting'
import type { Me } from '../lib/types'
import { authMachine } from '../stores/authMachine'
import { createStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { AppShellView } from './AppShellView'

function CurrentRoute() {
  const location = useLocation()
  return <output aria-label="Current route">{location.pathname}</output>
}

const meta = {
  title: 'Views/AppShellView',
  component: AppShellView,
  tags: ['!autodocs'],
  args: {
    children: (
      <main className="container" id="main" tabIndex={-1}>
        <p>page body</p>
        <CurrentRoute />
      </main>
    ),
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AppShellView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('link', { name: 'MemeOn' })).toBeInTheDocument()
    await expect(canvas.queryByRole('link', { name: 'My Binder' })).not.toBeInTheDocument()
  },
}

const connected: Story = {
  loaders: [() => {
    let resolvePack!: (response: Response) => void
    const packResponse = new Promise<Response>((resolve) => { resolvePack = resolve })
    const requests = {
      readIds: [] as string[],
      packClaims: 0,
      packClaimed: false,
      packResponse,
      resolvePack,
    }
    const actor = createActor(authMachine.provide({
      actors: {
        loadMe: fromPromise<Me | null>(async () => ({
          ...meLou,
          onboarding: requests.packClaimed ? { pack: 'done' } : {},
        })),
      },
      actions: { clearSessionAndFirebase: () => {} },
    }))
    return { shellStores: createStores(actor), requests, requestGuard: createRequestGuard() }
  }],
  beforeEach: async ({ loaded }) => {
    const originalFetch = window.fetch
    window.fetch = async (input, init) => {
      const path = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
      switch (path) {
        case '/api/alerts': return Response.json({
          alerts: [unreadSale, unreadFriend].map((alert) => ({
            ...alert,
            read: loaded.requests.readIds.includes(alert.id),
          })),
        })
        case '/api/alerts/read': {
          loaded.requests.readIds.push(...JSON.parse(String(init?.body)).ids)
          return Response.json({})
        }
        case '/api/onboarding': return Response.json({
          steps: loaded.requests.packClaimed ? questStepsPackDone : questStepsFresh,
        })
        case '/api/onboarding/claim-pack': {
          loaded.requests.packClaims += 1
          return loaded.requests.packResponse.then((response: Response) => {
            loaded.requests.packClaimed = response.ok
            return response
          })
        }
        default: return loaded.requestGuard.record(init?.method ?? 'GET', path)
      }
    }
    loaded.shellStores.retain()
    await loaded.shellStores.auth.refresh()
    return () => {
      loaded.shellStores.dispose()
      window.fetch = originalFetch
    }
  },
  render: (args, { loaded }) => (
    <StoresProvider stores={loaded.shellStores}>
      <AppShellView {...args} />
    </StoresProvider>
  ),
}

export const AlertsToggleAndLinks: Story = {
  ...connected,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: /^Alerts/ })
    await waitFor(() => expect(trigger).toHaveTextContent('2'))
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(loaded.requests.readIds).toEqual([unreadSale.id, unreadFriend.id]))
    await waitFor(() => expect(trigger).not.toHaveTextContent('2'))

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByText(unreadSale.message)).not.toBeInTheDocument()
    await userEvent.click(trigger)
    // the alert row itself is the link, so its name carries the unread cue and the timestamp too
    await userEvent.click(canvas.getByText(unreadSale.message))
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.getByRole('status', { name: 'Current route' })).toHaveTextContent(`/m/${unreadSale.memeId}`)

    await userEvent.click(trigger)
    await userEvent.click(canvas.getByText(unreadFriend.message))
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.getByRole('status', { name: 'Current route' })).toHaveTextContent(`/u/${encodeURIComponent(unreadFriend.subjectSub!)}`)
    await userEvent.click(trigger)
    await userEvent.click(canvas.getByText('page body'))
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(loaded.requests.readIds).toEqual([unreadSale.id, unreadFriend.id])
  },
}

export const ClaimPackAndDismissOverlay: Story = {
  ...connected,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: /claim your starter pack/i }))
    const opening = canvas.getByRole('button', { name: /Opening/ })
    await expect(opening).toBeDisabled()
    await userEvent.click(opening)
    await expect(loaded.requests.packClaims).toBe(1)

    loaded.requests.resolvePack(Response.json({ memes: [paperMeme], reward: 20 }))
    const modal = await canvas.findByRole('dialog', { name: /Starter pack opened/ })
    await expect(canvas.getByText('1/5')).toBeInTheDocument()
    await expect(within(modal).getByText(/You now hold 10 shares/)).toHaveTextContent('plus 20')
    await expect(within(modal).getByRole('link', { name: new RegExp(paperMeme.title) })).toHaveAttribute('href', `/m/${paperMeme.id}`)
    await userEvent.click(within(modal).getByRole('heading'))
    await expect(modal).toBeInTheDocument()
    /* the platform's Escape/cancel path ends in close; the shell clears the pack from context */
    ;(modal as HTMLDialogElement).close()
    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument())
    await expect(canvas.queryByRole('button', { name: /claim your starter pack/i })).not.toBeInTheDocument()
  },
}

export const EmptyVaultAndBinderDismiss: Story = {
  ...connected,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: /claim your starter pack/i }))
    loaded.requests.resolvePack(Response.json({ memes: [], reward: 20 }))
    const modal = await canvas.findByRole('dialog', { name: /Starter pack opened/ })
    await expect(within(modal).getByText(/The vault was empty/)).toHaveTextContent('20')
    await expect(within(modal).queryByRole('link', { name: new RegExp(paperMeme.title) })).not.toBeInTheDocument()
    await userEvent.click(within(modal).getByRole('link', { name: 'View in My Binder' }))
    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument())
    await expect(canvas.getByRole('status', { name: 'Current route' })).toHaveTextContent('/binder')
  },
}

export const LogoutClearsConnectedChrome: Story = {
  ...connected,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('button', { name: 'Log out' })).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'My Binder' })).toHaveAttribute('href', '/binder')
    await userEvent.click(canvas.getByRole('button', { name: 'Log out' }))
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument())
    await expect(canvas.queryByRole('link', { name: 'My Binder' })).not.toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'MemeOn' })).toBeInTheDocument()
    await expect(loaded.shellStores.auth.user).toBeNull()
    await expect(loaded.requests.readIds).toEqual([])
  },
}
