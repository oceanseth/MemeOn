import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { BinderView } from './BinderView'

const meta = {
  title: 'Views/BinderView',
  component: BinderView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/binder/user-lou']}>
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

export const InitialFailureIsEmpty: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/binder': { error: 'binder unavailable' } } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><BinderView /></ConnectedStory>,
  play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByText(/binder is empty/i)).toBeInTheDocument() },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/binder': async (_request, scenario) => { await scenario.waitForRelease('binder'); return { body: { memes: scenario.memes } } } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><BinderView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('.spin')).not.toBeNull()); loaded.scenario.release('binder'); await expect(await canvas.findByRole('link', { name: /fresh paper/ })).toBeInTheDocument() },
}
