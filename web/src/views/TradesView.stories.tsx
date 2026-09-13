import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory, RemountStory } from '../../.storybook/connected-story'
import { friendAccepted, giftablePaper, paperMeme, silverMeme } from '../../.storybook/fixtures'
import { tradesCopy as copy } from '../copy/trades'
import { TradesView } from './TradesView'

const meta = {
  title: 'Views/TradesView',
  component: TradesView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/trade']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TradesView>

export default meta
type Story = StoryObj<typeof meta>

async function flushDeliveredCallbacks(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

/** The Base UI trigger opens a portalled listbox, so the option is picked from `screen`. */
async function pickOption(trigger: HTMLElement, optionName: string | RegExp): Promise<void> {
  await userEvent.click(trigger)
  const listbox = await screen.findByRole('listbox')
  await userEvent.click(within(listbox).getByRole('option', { name: optionName }))
}

/**
 * The trigger is as wide as its widest option, so it carries a hidden copy of every label —
 * `toHaveTextContent` reads the option list. The chosen value is what is left without that copy.
 */
function chosenLabel(trigger: HTMLElement): string {
  const withoutSizer = trigger.cloneNode(true) as HTMLElement
  withoutSizer.querySelector('[data-slot="select-sizer"]')?.remove()
  return withoutSizer.textContent?.trim() ?? ''
}

export const CloseReopenRejectsLateComposeAndProposes: Story = {
  loaders: [connectedLoader({ overrides: {
    'GET /api/friends': async (_request, scenario) => {
      const call = scenario.requests.filter((request) => request.path === '/api/friends').length
      if (call === 1) { await scenario.waitForRelease('friends-a'); scenario.checkpoints.push('friends-a-returned'); return { body: { friends: [{ ...friendAccepted, sub: 'friend-a', name: 'Friend A' }] } } }
      await scenario.waitForRelease('friends-b')
      return { body: { friends: [{ ...friendAccepted, sub: 'friend-b', name: 'Friend B' }] } }
    },
    'GET /api/binder': async (_request, scenario) => {
      const call = scenario.requests.filter((request) => request.path === '/api/binder').length
      if (call === 1) { await scenario.waitForRelease('binder-a'); scenario.checkpoints.push('binder-a-returned'); return { body: { memes: [{ ...giftablePaper, id: 'offer-a', title: 'Offer A' }] } } }
      await scenario.waitForRelease('binder-b')
      return { body: { memes: [{ ...giftablePaper, id: 'offer-b', title: 'Offer B' }] } }
    },
    'GET /api/memes': async (_request, scenario) => {
      const call = scenario.requests.filter((request) => request.path === '/api/memes').length
      if (call === 1) { await scenario.waitForRelease('memes-a'); scenario.checkpoints.push('memes-a-returned'); return { body: { memes: [{ ...silverMeme, id: 'ask-a', title: 'Ask A', ownerId: 'friend-a' }] } } }
      await scenario.waitForRelease('memes-b')
      return { body: { memes: [{ ...silverMeme, id: 'ask-b', title: 'Ask B', ownerId: 'friend-b' }] } }
    },
  } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><TradesView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/fresh paper/)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: copy.newTrade }))
    await userEvent.click(canvas.getByRole('button', { name: copy.closeComposer }))
    loaded.scenario.release('friends-a'); loaded.scenario.release('binder-a'); loaded.scenario.release('memes-a')
    await waitFor(() => expect(loaded.scenario.checkpoints).toEqual(expect.arrayContaining(['friends-a-returned', 'binder-a-returned', 'memes-a-returned'])))
    await flushDeliveredCallbacks()
    await expect(canvas.queryByRole('combobox')).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: copy.newTrade })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: copy.newTrade }))
    const selects = await canvas.findAllByRole('combobox')
    await waitFor(() => expect(loaded.scenario.requests.filter((request: { path: string }) => ['/api/friends', '/api/binder', '/api/memes'].includes(request.path))).toHaveLength(6))
    await expect(selects[0]).not.toHaveTextContent('Friend A')
    await expect(selects[1]).not.toHaveTextContent('Offer A')
    await expect(selects[2]).not.toHaveTextContent('Ask A')
    loaded.scenario.release('friends-b'); loaded.scenario.release('binder-b'); loaded.scenario.release('memes-b')
    await waitFor(() => expect(selects[0]).toHaveTextContent('Friend B'))
    await pickOption(selects[0]!, 'Friend B')
    await pickOption(selects[1]!, /^Offer B/)
    await pickOption(selects[2]!, 'Ask B')
    await expect(selects[0]).not.toHaveTextContent('Friend A')
    await expect(selects[1]).not.toHaveTextContent('Offer A')
    await expect(selects[2]).not.toHaveTextContent('Ask A')
    const amounts = canvas.getAllByRole('spinbutton')
    for (const [input, value] of [[amounts[0], '4'], [amounts[1], '12'], [amounts[2], '6'], [amounts[3], '8']] as const) {
      await userEvent.clear(input!)
      await userEvent.type(input!, value)
    }
    await userEvent.click(canvas.getByRole('button', { name: copy.newTrade }))
    await waitFor(() => expect(loaded.scenario.requests.find((request: { method: string; path: string }) => request.method === 'POST' && request.path === '/api/trades')?.body).toEqual({
      toId: 'friend-b', offer: { memes: [{ memeId: 'offer-b', shares: 4 }], coins: 12 }, ask: { memes: [{ memeId: 'ask-b', shares: 6 }], coins: 8 },
    }))
    await expect(loaded.scenario.requests.some((request: { path: string }) => request.path.includes('/api/users/friend-b/profile'))).toBe(false)
  },
}

export const BReadyRejectsLateAComposeResults: Story = {
  loaders: [connectedLoader({ overrides: {
    'GET /api/friends': async (_request, scenario) => {
      const call = scenario.requests.filter((request) => request.path === '/api/friends').length
      if (call === 1) { await scenario.waitForRelease('late-friends-a'); scenario.checkpoints.push('late-friends-a-returned'); return { body: { friends: [{ ...friendAccepted, sub: 'friend-a', name: 'Friend A' }] } } }
      return { body: { friends: [{ ...friendAccepted, sub: 'friend-b', name: 'Friend B' }] } }
    },
    'GET /api/binder': async (_request, scenario) => {
      const call = scenario.requests.filter((request) => request.path === '/api/binder').length
      if (call === 1) { await scenario.waitForRelease('late-binder-a'); scenario.checkpoints.push('late-binder-a-returned'); return { body: { memes: [{ ...giftablePaper, id: 'offer-a', title: 'Offer A' }] } } }
      return { body: { memes: [{ ...giftablePaper, id: 'offer-b', title: 'Offer B' }] } }
    },
    'GET /api/memes': async (_request, scenario) => {
      const call = scenario.requests.filter((request) => request.path === '/api/memes').length
      if (call === 1) { await scenario.waitForRelease('late-memes-a'); scenario.checkpoints.push('late-memes-a-returned'); return { body: { memes: [{ ...silverMeme, id: 'ask-a', title: 'Ask A', ownerId: 'friend-a' }] } } }
      return { body: { memes: [{ ...silverMeme, id: 'ask-b', title: 'Ask B', ownerId: 'friend-b' }] } }
    },
  } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><TradesView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/fresh paper/)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: copy.newTrade }))
    await userEvent.click(canvas.getByRole('button', { name: copy.closeComposer }))
    await userEvent.click(canvas.getByRole('button', { name: copy.newTrade }))
    const selects = await canvas.findAllByRole('combobox')
    await waitFor(() => {
      expect(selects[0]).toHaveTextContent('Friend B')
      expect(selects[1]).toHaveTextContent('Offer B')
    })
    await pickOption(selects[0]!, 'Friend B')
    await waitFor(() => expect(selects[2]).toHaveTextContent('Ask B'))
    await pickOption(selects[1]!, /^Offer B/)
    await pickOption(selects[2]!, 'Ask B')
    loaded.scenario.release('late-friends-a'); loaded.scenario.release('late-binder-a'); loaded.scenario.release('late-memes-a')
    await waitFor(() => expect(loaded.scenario.checkpoints).toEqual(expect.arrayContaining(['late-friends-a-returned', 'late-binder-a-returned', 'late-memes-a-returned'])))
    await flushDeliveredCallbacks()
    await expect(chosenLabel(selects[0]!)).toBe('Friend B')
    await expect(chosenLabel(selects[1]!)).toMatch(/^Offer B/)
    await expect(chosenLabel(selects[2]!)).toBe('Ask B')
    await expect(selects[0]).not.toHaveTextContent('Friend A')
    await expect(selects[1]).not.toHaveTextContent('Offer A')
    await expect(selects[2]).not.toHaveTextContent('Ask A')
  },
}

export const RespondToProposal: Story = {
  loaders: [connectedLoader({ overrides: {
    'GET /api/trades': (_request, scenario) => ({ body: { trades: scenario.trades.map((trade) => ({ ...trade, fromId: 'user-pal', fromName: 'pal', toId: 'user-lou', toName: 'lou' })) } }),
  } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><TradesView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: "Accept pal's trade" }))
    // the irreversible action restates the deal before it fires
    const dialog = within(await canvas.findByRole('alertdialog'))
    await expect(dialog.getByText(copy.confirm.acceptTitle)).toBeInTheDocument()
    await userEvent.click(dialog.getByRole('button', { name: copy.confirm.acceptLabel }))
    await expect(await canvas.findByText(copy.toasts.executed)).toBeInTheDocument()
    await expect(loaded.scenario.requests.find((request: { path: string }) => request.path === '/api/trades/trade-1/respond')?.body).toEqual({ action: 'accept' })
    await waitFor(() => expect(loaded.scenario.stores.auth.snapshot.hasTag('settled')).toBe(true))
  },
}

export const MemeTitleCacheIsMountLocal: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><RemountStory>{(key) => <TradesView key={key} />}</RemountStory></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(new RegExp(paperMeme.title))).toBeInTheDocument()
    const meme = loaded.scenario.memes.find((candidate: { id: string }) => candidate.id === paperMeme.id)!
    meme.title = 'second mount title'
    await userEvent.click(canvas.getByRole('button', { name: 'Remount connected view' }))
    await expect(await canvas.findByText(/second mount title/)).toBeInTheDocument()
    await expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === `/api/memes/${paperMeme.id}`)).toHaveLength(2)
  },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/trades': async (_request, scenario) => { await scenario.waitForRelease('trades'); return { body: { trades: scenario.trades } } } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><TradesView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('[data-slot="skeleton-row"]')).not.toBeNull()); loaded.scenario.release('trades'); await expect(await canvas.findByText(/fresh paper/)).toBeInTheDocument() },
}

/** a failed load is an error with a way out, never a fake "nothing pending" */
export const InitialFailureOffersRetry: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/trades': { error: 'offline' } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><TradesView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
    await expect(canvas.queryByText(/Nothing pending/)).not.toBeInTheDocument()
  },
}

export const ProposalFailureStaysInComposer: Story = {
  loaders: [connectedLoader({ failures: { 'POST /api/trades': { error: 'proposal rejected', status: 409 } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><TradesView /></ConnectedStory>,
  play: async ({ canvasElement }) => { const canvas = within(canvasElement); await userEvent.click(await canvas.findByRole('button', { name: copy.newTrade })); const selects = await canvas.findAllByRole('combobox'); await waitFor(() => expect(selects[0]).toHaveTextContent('pal')); await pickOption(selects[0]!, 'pal'); await userEvent.type(canvas.getAllByRole('spinbutton')[1]!, '5'); await userEvent.click(canvas.getByRole('button', { name: copy.newTrade })); await expect(await canvas.findByText('proposal rejected')).toBeInTheDocument(); await expect(canvas.getByRole('button', { name: copy.closeComposer })).toBeInTheDocument() },
}
