import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { listedHolo, meLou } from '../../.storybook/fixtures'
import { connectedBeforeEach, connectedLoader, ConnectedStory, RemountStory } from '../../.storybook/connected-story'
import { MemeDetailView } from './MemeDetailView'

const meta = {
  title: 'Views/MemeDetailView',
  component: MemeDetailView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[`/m/${listedHolo.id}`]}>
        <Routes><Route path="/m/:id" element={<Story />} /></Routes>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MemeDetailView>

export default meta
type Story = StoryObj<typeof meta>

export const OwnerActionsAndMalformedMemeplexUrl: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MemeDetailView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('heading', { name: listedHolo.title })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Remove listing' }))
    await expect(await canvas.findByText('Delisted')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /Make private/ }))
    await expect(await canvas.findByText(/Hidden from the marketplace/)).toBeInTheDocument()
    const pasted = canvas.getByPlaceholderText('…or paste a meme link')
    await userEvent.type(pasted, 'https://memeon.ai/m/%E0%A4%A')
    await userEvent.click(canvas.getAllByRole('button', { name: 'Link' }).at(-1)!)
    await expect(await canvas.findByText('Added to the memeplex 🕸️')).toBeInTheDocument()
    await expect(loaded.scenario.requests.find((request: { path: string; method: string }) => request.path === `/api/memes/${listedHolo.id}/memeplex` && request.method === 'POST')?.body).toEqual({ memeId: 'https://memeon.ai/m/%E0%A4%A' })
  },
}

export const DeleteCancelAndConfirm: Story = {
  loaders: [connectedLoader({ overrides: {
    [`GET /api/memes/${listedHolo.id}`]: () => ({ body: { meme: { ...listedHolo, listing: null, private: true }, positions: [{ userId: meLou.sub, shares: 100 }] } }),
  } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MemeDetailView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('🙈 private')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /Delete forever/ }))
    let dialog = await canvas.findByRole('alertdialog')
    await expect(within(dialog).getByRole('heading')).toHaveTextContent('Delete this meme forever')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await expect(canvas.queryByRole('alertdialog')).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /Delete forever/ }))
    dialog = await canvas.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete it forever' }))
    await waitFor(() => expect(loaded.scenario.requests.some((request: { path: string; method: string }) => request.path === `/api/memes/${listedHolo.id}` && request.method === 'DELETE')).toBe(true))
  },
}

export const BuyerFlow: Story = {
  loaders: [connectedLoader({ user: { ...meLou, sub: 'buyer', name: 'buyer' } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MemeDetailView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const shares = await canvas.findByRole('spinbutton')
    await userEvent.clear(shares)
    await userEvent.type(shares, '2')
    await userEvent.click(canvas.getByRole('button', { name: /Buy for/ }))
    await expect(await canvas.findByText('Shares acquired 💼')).toBeInTheDocument()
    await expect(loaded.scenario.requests.find((request: { path: string }) => request.path.endsWith('/buy'))?.body).toEqual({ shares: 2 })
  },
}

export const MissingIsEmpty: Story = {
  loaders: [connectedLoader({ failures: { [`GET /api/memes/${listedHolo.id}`]: { error: 'missing', status: 404 } } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MemeDetailView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/may have been deleted or made private/)).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'Browse the marketplace' })).toBeInTheDocument()
  },
}

export const HolderNameCacheIsMountLocal: Story = {
  loaders: [connectedLoader({ overrides: {
    [`GET /api/memes/${listedHolo.id}`]: (_request, scenario) => ({ body: { meme: scenario.memes.find((candidate) => candidate.id === listedHolo.id), positions: [{ userId: 'user-a', shares: 25 }] } }),
    'GET /api/users': (_request, scenario) => ({ body: { users: [scenario.profiles.get('user-a')!.profile] } }),
  } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><RemountStory>{(key) => <MemeDetailView key={key} />}</RemountStory></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('first title')).toBeInTheDocument()
    loaded.scenario.profiles.get('user-a').profile.name = 'second title'
    await userEvent.click(canvas.getByRole('button', { name: 'Remount connected view' }))
    await expect(await canvas.findByText('second title')).toBeInTheDocument()
    await expect(loaded.scenario.requests.filter((request: { path: string }) => request.path === '/api/users?q=')).toHaveLength(2)
  },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { [`GET /api/memes/${listedHolo.id}`]: async (_request, scenario) => { await scenario.waitForRelease('detail'); return { body: { meme: scenario.memes.find((candidate) => candidate.id === listedHolo.id), positions: [{ userId: meLou.sub, shares: 100 }] } } } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MemeDetailView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('.spin')).not.toBeNull()); loaded.scenario.release('detail'); await expect(await canvas.findByRole('heading', { name: listedHolo.title })).toBeInTheDocument() },
}

export const ListShares: Story = {
  loaders: [connectedLoader({ overrides: { [`GET /api/memes/${listedHolo.id}`]: () => ({ body: { meme: { ...listedHolo, listing: null }, positions: [{ userId: meLou.sub, shares: 100 }] } }) } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MemeDetailView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement); const inputs = await canvas.findAllByRole('spinbutton'); await userEvent.clear(inputs[0]!); await userEvent.type(inputs[0]!, '4'); await userEvent.clear(inputs[1]!); await userEvent.type(inputs[1]!, '2')
    await userEvent.click(canvas.getByRole('button', { name: 'List' })); await expect(await canvas.findByText('Listed on the marketplace 🏷️')).toBeInTheDocument()
    await expect(loaded.scenario.requests.find((request: { path: string }) => request.path.endsWith('/list'))?.body).toEqual({ shares: 4, pricePerShare: 2 })
  },
}

export const BuyFailureKeepsLoadedDetail: Story = {
  loaders: [connectedLoader({ user: { ...meLou, sub: 'buyer', name: 'buyer' }, failures: { [`POST /api/memes/${listedHolo.id}/buy`]: { error: 'insufficient braincells', status: 409 } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MemeDetailView /></ConnectedStory>,
  play: async ({ canvasElement }) => { const canvas = within(canvasElement); await userEvent.click(await canvas.findByRole('button', { name: /Buy for/ })); await expect(await canvas.findByText('insufficient braincells')).toBeInTheDocument(); await expect(canvas.getByRole('heading', { name: listedHolo.title })).toBeInTheDocument() },
}
