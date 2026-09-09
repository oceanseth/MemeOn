import type { Meta, StoryObj } from '@storybook/react-vite'
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

export const CreateCopyAndRevoke: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DevelopersView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('my-trading-bot')).toBeInTheDocument()
    await userEvent.type(canvas.getByRole('textbox', { name: 'API key label' }), 'story client')
    await userEvent.click(canvas.getByRole('button', { name: 'Generate API key' }))
    await expect(await canvas.findByText(loaded.scenario.freshKey)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Copy API key' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Copy API key' })).toHaveTextContent('Copied'))
    await waitFor(() => expect(loaded.scenario.copied).toEqual([loaded.scenario.freshKey]))
    await userEvent.click(canvas.getByRole('button', { name: 'Revoke API key my-trading-bot' }))
    const dialog = await canvas.findByRole('alertdialog')
    await expect(within(dialog).getByRole('heading')).toHaveTextContent('Revoke this API key')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke it' }))
    await waitFor(() => expect(canvas.queryByText('my-trading-bot')).not.toBeInTheDocument())
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
  },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/developers/keys': async (_request, scenario) => { await scenario.waitForRelease('keys'); return { body: { keys: scenario.keys } } } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DevelopersView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('.spin')).not.toBeNull()); loaded.scenario.release('keys'); await expect(await canvas.findByText('my-trading-bot')).toBeInTheDocument() },
}

export const KeyListFailureIsEmpty: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/developers/keys': { error: 'offline' } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><DevelopersView /></ConnectedStory>,
  play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByText('No keys yet.')).toBeInTheDocument() },
}
