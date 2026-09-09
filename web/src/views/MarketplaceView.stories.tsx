import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { MarketplaceView } from './MarketplaceView'

const meta = {
  title: 'Views/MarketplaceView',
  component: MarketplaceView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/marketplace']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof MarketplaceView>

export default meta
type Story = StoryObj<typeof meta>

const connected: Story = {
  loaders: [connectedLoader()],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MarketplaceView /></ConnectedStory>,
}

export const FiltersSortAndStyles: Story = {
  ...connected,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('link', { name: /fresh paper/i })).toBeInTheDocument()
    const search = canvas.getByRole('searchbox')
    await userEvent.type(search, 'holo')
    await waitFor(() => expect(canvas.queryByRole('link', { name: /fresh paper/i })).not.toBeInTheDocument())
    await expect(canvas.getByRole('link', { name: /holo hit/i })).toBeInTheDocument()
    const selects = canvas.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0]!, 'image')
    await userEvent.selectOptions(selects[1]!, 'holo')
    await userEvent.click(canvas.getByRole('checkbox', { name: /for sale/i }))
    await waitFor(() => expect(loaded.scenario.requests.some((request: { path: string }) => request.path.includes('listed=true'))).toBe(true))
    const valueSort = canvas.getByRole('button', { name: /Value/ })
    await userEvent.click(valueSort)
    await expect(valueSort).toHaveAttribute('aria-pressed', 'true')
    await expect(getComputedStyle(canvas.getByRole('button', { name: /Create meme/ })).fontWeight).toBe('600')
    await expect(loaded.scenario.unexpected).toEqual([])
  },
}

export const ReachableErrorUsesEmptyPresentation: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/memes': { error: 'catalog unavailable' } } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MarketplaceView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/No memes match/)).toBeInTheDocument()
  },
}

export const Empty: Story = {
  loaders: [connectedLoader({ empty: true })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MarketplaceView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/No memes match/)).toBeInTheDocument()
  },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/memes': async (_request, scenario) => { await scenario.waitForRelease('market'); return { body: { memes: scenario.memes, nextCursor: null } } } } })],
  beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MarketplaceView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('.spin')).not.toBeNull()); loaded.scenario.release('market')
    await expect(await canvas.findByRole('link', { name: /fresh paper/ })).toBeInTheDocument()
  },
}

export const CursorContinuation: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/memes': (request, scenario) => request.path.includes('cursor=page-2') ? { body: { memes: [scenario.mintedMeme], nextCursor: null } } : { body: { memes: scenario.memes, nextCursor: 'page-2' } } } })],
  beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MarketplaceView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement); await expect(await canvas.findByRole('link', { name: /fresh paper/ })).toBeInTheDocument()
    await waitFor(() => expect(loaded.scenario.intersectionObservers.length).toBeGreaterThan(0)); loaded.scenario.intersect()
    await expect(await canvas.findByRole('link', { name: /story mint/ })).toBeInTheDocument()
    await expect(loaded.scenario.requests.some((request: { path: string }) => request.path.includes('cursor=page-2'))).toBe(true)
  },
}
