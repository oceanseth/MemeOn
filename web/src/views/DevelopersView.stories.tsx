import type { Meta, StoryContext, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { DevelopersView } from './DevelopersView'

const meta = {
  title: 'Views/DevelopersView',
  component: DevelopersView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/developers']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof DevelopersView>

export default meta
type Story = StoryObj<typeof meta>

const copyButton = { name: /^Cop(?:y|ied) API key$/ }

/** story-local clipboard refusal; the shared preview mock is restored by the returned cleanup */
async function denyClipboard(context: StoryContext) {
  const restoreScenario = await connectedBeforeEach(context)
  const original = navigator.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => { throw new Error('denied') } },
  })
  return () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: original })
    restoreScenario()
  }
}

export const CreateCopyAndRevoke: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DevelopersView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('my-trading-bot')).toBeInTheDocument()
    // the primary action is reachable without leaving the keyboard
    await userEvent.type(canvas.getByRole('textbox', { name: 'API key label' }), 'story client{Enter}')
    await expect(await canvas.findByText(loaded.scenario.freshKey)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', copyButton))
    await waitFor(() => expect(canvas.getByRole('button', copyButton)).toHaveTextContent('Copied'))
    await waitFor(() => expect(loaded.scenario.copied).toEqual([loaded.scenario.freshKey]))
    await userEvent.click(canvas.getByRole('button', { name: 'Revoke API key my-trading-bot' }))
    const dialog = await canvas.findByRole('alertdialog')
    await expect(within(dialog).getByRole('heading')).toHaveTextContent('Revoke this API key')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke it' }))
    await waitFor(() => expect(canvas.queryByText('my-trading-bot')).not.toBeInTheDocument())
    // the irreversible action ends on a confirmation, not on silence
    await expect(await canvas.findByText('Revoked my-trading-bot.')).toBeInTheDocument()
    await expect(loaded.scenario.unexpected).toEqual([])
  },
}

export const CreateFailure: Story = {
  loaders: [connectedLoader({ failures: { 'POST /api/developers/keys': { error: 'key quota reached', status: 409 } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DevelopersView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Generate API key' }))
    await expect(await canvas.findByRole('alert')).toHaveTextContent('key quota reached')
    // typing the next attempt clears the stale banner
    await userEvent.type(canvas.getByRole('textbox', { name: 'API key label' }), 'retry')
    await waitFor(() => expect(canvas.queryByRole('alert')).toBeNull())
  },
}

/** A slow POST must not mint a second key the user can never see. */
export const DoubleSubmitMintsOneKey: Story = {
  loaders: [connectedLoader({ overrides: { 'POST /api/developers/keys': async (_request, scenario) => { await scenario.waitForRelease('create'); scenario.keys.push({ prefix: 'mk_story', label: 'held', createdAt: '2026-09-08T00:00:00.000Z' }); return { body: { key: scenario.freshKey } } } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DevelopersView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    const generate = await canvas.findByRole('button', { name: /Generat/ })
    await userEvent.click(generate)
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Generating…' })).toBeDisabled())
    await userEvent.click(canvas.getByRole('button', { name: 'Generating…' }))
    loaded.scenario.release('create')
    await expect(await canvas.findByText(loaded.scenario.freshKey)).toBeInTheDocument()
    const posts = loaded.scenario.requests.filter((entry: { method: string; path: string }) => entry.method === 'POST' && entry.path === '/api/developers/keys')
    await expect(posts).toHaveLength(1)
  },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/developers/keys': async (_request, scenario) => { await scenario.waitForRelease('keys'); return { body: { keys: scenario.keys } } } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DevelopersView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('[data-slot=spinner]')).not.toBeNull()); await expect(canvas.getByText('Loading your API keys…')).toBeInTheDocument(); loaded.scenario.release('keys'); await expect(await canvas.findByText('my-trading-bot')).toBeInTheDocument() },
}

/** A failed list fetch is an unknown list, never an empty account. */
export const KeyListFailureShowsRetry: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/developers/keys': { error: 'offline' } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DevelopersView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByRole('alert')).toHaveTextContent('your keys are still active')
    await expect(canvas.queryByText(/No keys yet/)).toBeNull()
    loaded.scenario.options.failures = {}
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    await expect(await canvas.findByText('my-trading-bot')).toBeInTheDocument()
  },
}

/** A denied clipboard leaves the one-time secret on screen and selectable. */
export const CopyDenied: Story = {
  loaders: [connectedLoader()], beforeEach: denyClipboard,
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DevelopersView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Generate API key' }))
    await expect(await canvas.findByText(loaded.scenario.freshKey)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', copyButton))
    await expect(await canvas.findByRole('alert')).toHaveTextContent('copy it manually')
    await expect(canvas.getByText(loaded.scenario.freshKey)).toHaveAttribute('tabindex', '0')
  },
}

/** A failed DELETE keeps the dialog open with the reason inside it; the key is still listed. */
export const RevokeFailureKeepsDialogOpen: Story = {
  loaders: [connectedLoader({ failures: { 'DELETE /api/developers/keys/mo_live_abcd': { error: 'gone wrong' } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DevelopersView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button', { name: 'Revoke API key my-trading-bot' }))
    const dialog = await canvas.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke it' }))
    await expect(await within(dialog).findByRole('alert')).toHaveTextContent('Couldn’t revoke my-trading-bot')
    await expect(dialog).toBeVisible()
    await expect(canvas.getByText('my-trading-bot')).toBeInTheDocument()
  },
}
