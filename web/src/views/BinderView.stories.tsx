import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { BinderView } from './BinderView'

const meta = {
  title: 'Views/BinderView',
  component: BinderView,
  tags: ['!autodocs'],
  // one Router for the whole file; a story seeds its own URL through parameters.route
  decorators: [
    (Story, context) => (
      <MemoryRouter initialEntries={[String(context.parameters.route ?? '/binder/user-lou')]}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof BinderView>

export default meta
type Story = StoryObj<typeof meta>

const connected: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><BinderView /></ConnectedStory>,
}

export const PrivateToggleAndSort: Story = {
  ...connected,
  loaders: [connectedLoader({ overrides: {
    'GET /api/binder': (_request, scenario) => ({ body: { memes: scenario.memes.map((meme, index) => ({ ...meme, private: index === 0 })) } }),
  } })],
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/Show private \(1\)/)).toBeInTheDocument()
    await expect(canvas.queryByRole('link', { name: /fresh paper/i })).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('checkbox', { name: /Show private/ }))
    await expect(canvas.getByRole('link', { name: /fresh paper/i })).toBeInTheDocument()
    const views = canvas.getByRole('button', { name: /Views/ })
    await userEvent.click(views)
    await expect(views).toHaveAttribute('aria-pressed', 'true')
    await expect(loaded.scenario.unexpected).toEqual([])
  },
}

/** The sort and private choices are shareable: a seeded URL restores them before the first paint. */
export const SortAndPrivateFromUrl: Story = {
  loaders: [connectedLoader({ overrides: {
    'GET /api/binder': (_request, scenario) => ({ body: { memes: scenario.memes.map((meme, index) => ({ ...meme, private: index === 0 })) } }),
  } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  parameters: { route: '/binder/user-lou?sort=value&dir=asc&private=1' },
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><BinderView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('checkbox', { name: /Show private/ })).toBeChecked()
    await expect(canvas.getByRole('button', { name: /Value/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: /Value/ })).toHaveTextContent('↑')
    await expect(canvas.getByRole('link', { name: /fresh paper/i })).toBeInTheDocument()
  },
}

let binderAttempts = 0

/** A failed load must never be dressed up as an empty collection: it names the failure and retries. */
export const InitialFailureShowsRetry: Story = {
  loaders: [connectedLoader({ overrides: {
    'GET /api/binder': (_request, scenario) => (++binderAttempts === 1
      ? { status: 503, body: { error: 'binder unavailable' } }
      : { body: { memes: scenario.memes } }),
  } })],
  beforeEach: async (context) => { binderAttempts = 0; return connectedBeforeEach(context) },
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><BinderView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const alert = await canvas.findByRole('alert')
    await expect(alert).toHaveTextContent("Couldn't load your binder.")
    await expect(canvas.queryByText(/binder is empty/i)).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    await expect(await canvas.findByRole('link', { name: /fresh paper/i })).toBeInTheDocument()
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
  },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/binder': async (_request, scenario) => { await scenario.waitForRelease('binder'); return { body: { memes: scenario.memes } } } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><BinderView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelectorAll('[data-slot="skeleton-card"]').length).toBeGreaterThan(0)); loaded.scenario.release('binder'); await expect(await canvas.findByRole('link', { name: /fresh paper/ })).toBeInTheDocument() },
}
