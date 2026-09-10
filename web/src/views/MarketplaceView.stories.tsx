import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import type { ConnectedScenario } from '../../.storybook/connected-scenario'
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

/** The shareable half of the surface, so a play test can assert the link the filters produce. */
function CurrentSearch() {
  return <p aria-label="Current search">{useLocation().search}</p>
}

/** The Base UI trigger opens a portalled listbox, so the option is picked from `screen`. */
async function pickOption(trigger: HTMLElement, optionName: string): Promise<void> {
  await userEvent.click(trigger)
  const listbox = await screen.findByRole('listbox')
  await userEvent.click(within(listbox).getByRole('option', { name: optionName }))
}

const marketCalls = (scenario: ConnectedScenario, match = ''): number =>
  scenario.requests.filter(
    (request) => request.path.startsWith('/api/memes?') && request.path.includes(match),
  ).length

const connected: Story = {
  loaders: [connectedLoader()],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MarketplaceView /></ConnectedStory>,
}

export const FiltersSortAndStyles: Story = {
  ...connected,
  render: (_args, { loaded }) => (
    <ConnectedStory scenario={loaded.scenario}>
      <MarketplaceView />
      <CurrentSearch />
    </ConnectedStory>
  ),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('link', { name: /fresh paper/i })).toBeInTheDocument()
    const search = canvas.getByRole('searchbox', { name: /search memes/i })
    await userEvent.type(search, 'holo')
    await waitFor(() => expect(canvas.queryByRole('link', { name: /fresh paper/i })).not.toBeInTheDocument())
    await expect(canvas.getByRole('link', { name: /holo hit/i })).toBeInTheDocument()
    await pickOption(canvas.getByRole('combobox', { name: /media type/i }), 'Images')
    await pickOption(canvas.getByRole('combobox', { name: /tier/i }), 'Holo')
    await userEvent.click(canvas.getByRole('checkbox', { name: /for sale/i }))
    await waitFor(() => expect(loaded.scenario.requests.some((request: { path: string }) => request.path.includes('listed=true'))).toBe(true))
    // the filter set is linkable and survives a reload
    await expect(canvas.getByLabelText('Current search')).toHaveTextContent(
      'q=holo&type=image&tier=holo&listed=true',
    )
    // ranking a loaded sample would be a wrong answer, so the chips say what the market can do
    await expect(canvas.getByRole('button', { name: /Value/ })).toBeDisabled()
    await expect(canvas.getByRole('group', { name: 'Sort by' })).toHaveAccessibleDescription(/rank/)
    await expect(canvas.getByRole('status')).toHaveTextContent('Images · Holo · for sale')
    await expect(getComputedStyle(canvas.getByRole('link', { name: /Mint a meme/ })).fontWeight).toBe('600')
    await expect(loaded.scenario.unexpected).toEqual([])
  },
}

export const LoadFailureOffersRetry: Story = {
  loaders: [connectedLoader({
    overrides: {
      'GET /api/memes': (_request, scenario) => marketCalls(scenario) === 1
        ? { status: 500, body: { error: 'catalog unavailable' } }
        : { body: { memes: scenario.memes, nextCursor: null } },
    },
  })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MarketplaceView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const alert = await canvas.findByRole('alert')
    await expect(alert).toHaveTextContent(/Couldn't reach the market/)
    await expect(canvas.queryByText(/No memes match/)).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    await expect(await canvas.findByRole('link', { name: /fresh paper/i })).toBeInTheDocument()
  },
}

export const LoadMoreFailureKeepsTheCursor: Story = {
  loaders: [connectedLoader({
    overrides: {
      'GET /api/memes': (request, scenario) => {
        if (!request.path.includes('cursor=')) {
          return { body: { memes: scenario.memes, nextCursor: 'page-2' } }
        }
        return marketCalls(scenario, 'cursor=') === 1
          ? { status: 500, body: { error: 'page unavailable' } }
          : { body: { memes: [scenario.mintedMeme], nextCursor: null } }
      },
    },
  })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><MarketplaceView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('link', { name: /fresh paper/i })).toBeInTheDocument()
    await waitFor(() => expect(loaded.scenario.intersectionObservers.length).toBeGreaterThan(0))
    loaded.scenario.intersect()
    await expect(await canvas.findByRole('alert')).toHaveTextContent(/next page/)
    const retry = canvas.getByRole('button', { name: 'Try again' })
    await userEvent.click(retry)
    await expect(await canvas.findByRole('link', { name: /story mint/ })).toBeInTheDocument()
    await expect(canvas.getByText(/every meme matching these filters/)).toBeInTheDocument()
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
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvasElement.querySelector('[data-slot="skeleton-card"]')).not.toBeNull())
    await expect(canvas.getByRole('status')).toHaveTextContent('Searching the market…')
    loaded.scenario.release('market')
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
