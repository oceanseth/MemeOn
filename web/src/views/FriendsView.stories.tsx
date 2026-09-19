import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { friendsCopy as copy } from '../copy/friends'
import { FriendsView } from './FriendsView'

const meta = {
  title: 'Views/FriendsView',
  component: FriendsView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/friends']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof FriendsView>

export default meta
type Story = StoryObj<typeof meta>

export const SearchRequestRespondAndGift: Story = {
  loaders: [connectedLoader()], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><FriendsView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('incoming pal')).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: 'pal' })).toHaveAttribute('href', '/u/user-pal')
    await userEvent.type(canvas.getByRole('searchbox', { name: copy.search.inputLabel }), 'first')
    const add = await canvas.findByRole('button', { name: new RegExp(`^${copy.search.addFriend} — `) })
    await userEvent.click(add)
    await expect(await canvas.findByText(copy.toasts.requestSent)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: copy.row.accept('incoming pal') }))
    await waitFor(() => expect(canvas.queryByRole('heading', { name: copy.sections.incoming })).not.toBeInTheDocument())
    await userEvent.click(canvas.getAllByRole('button', { name: /^Gift shares to / })[0]!)
    const dialog = await canvas.findByRole('dialog', { name: /Gift to pal/ })
    await userEvent.click(await within(dialog).findByRole('button', { name: /fresh paper/ }))
    await expect(within(dialog).getByRole('spinbutton')).toHaveValue(1)
    await userEvent.click(within(dialog).getByRole('button', { name: /Gift 1 of/ }))
    await expect(await canvas.findByText(/Gifted 1 share/)).toBeInTheDocument()
    await expect(loaded.scenario.requests.find((request: { path: string }) => request.path === '/api/gift')?.body).toEqual({ memeId: 'meme-paper', toSub: 'user-pal', shares: 1 })
    await userEvent.click(canvas.getByRole('button', { name: copy.invite.button }))
    await waitFor(() => expect(loaded.scenario.shared).toHaveLength(1))
  },
}

export const InitialFailureShowsError: Story = {
  loaders: [connectedLoader({ failures: { 'GET /api/friends': { error: 'offline' } } })], beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><FriendsView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(copy.loadError.title)).toBeInTheDocument()
    await expect(canvas.queryByText(copy.empty.title)).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: copy.loadError.retry })).toBeInTheDocument()
  },
}

export const LoadingThenReady: Story = {
  loaders: [connectedLoader({ overrides: { 'GET /api/friends': async (_request, scenario) => { await scenario.waitForRelease('friends'); return { body: { friends: scenario.friends } } } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><FriendsView /></ConnectedStory>,
  play: async ({ canvasElement, loaded }) => { const canvas = within(canvasElement); await waitFor(() => expect(canvasElement.querySelector('[data-slot="spinner"]')).not.toBeNull()); loaded.scenario.release('friends'); await expect(await canvas.findByText('incoming pal')).toBeInTheDocument() },
}

export const GiftFailureStaysInOverlay: Story = {
  loaders: [connectedLoader({ failures: { 'POST /api/gift': { error: 'gift unavailable' } } })], beforeEach: async (context) => connectedBeforeEach(context), render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><FriendsView /></ConnectedStory>,
  play: async ({ canvasElement }) => { const canvas = within(canvasElement); await userEvent.click((await canvas.findAllByRole('button', { name: /^Gift shares to / }))[0]!); const dialog = await canvas.findByRole('dialog', { name: /Gift to pal/ }); await userEvent.click(await within(dialog).findByRole('button', { name: /fresh paper/ })); await userEvent.click(within(dialog).getByRole('button', { name: /Gift 1 of/ })); await expect(await within(dialog).findByText('gift unavailable')).toBeInTheDocument()
    /* Escape belongs to Base UI's dismissal now, not to a showModal() close watcher, so a
       synthetic key event reaches it and the wiring is proved for real rather than simulated. */
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull())
  },
}
