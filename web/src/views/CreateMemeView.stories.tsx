import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { connectedBeforeEach, connectedLoader, ConnectedStory } from '../../.storybook/connected-story'
import { giphyCat } from '../../.storybook/fixtures'
import { CreateMemeView } from './CreateMemeView'

function CurrentRoute() {
  return <output aria-label="Current route">{useLocation().pathname}</output>
}

const meta = {
  title: 'Views/CreateMemeView',
  component: CreateMemeView,
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/binder/new']}>
        <Story /><CurrentRoute />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof CreateMemeView>

export default meta
type Story = StoryObj<typeof meta>

const connected: Story = {
  loaders: [connectedLoader()],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><CreateMemeView /></ConnectedStory>,
}

export const GenerateAndMint: Story = {
  ...connected,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Title' }), 'generated story')
    await userEvent.type(canvas.getByRole('textbox', { name: /^Prompt/ }), 'a cat on the moon')
    await userEvent.click(canvas.getByRole('button', { name: 'Render the image' }))
    await expect(await canvas.findByRole('img', { name: /^Preview of/ })).toHaveAttribute('src', loaded.scenario.generatedImage)
    const mintButton = canvas.getByRole('button', { name: /Mint/ })
    await expect(mintButton).toBeEnabled()
    await userEvent.click(mintButton)
    await waitFor(() => expect(loaded.scenario.requests.some((request: { method: string; path: string; body: { title?: string } }) => request.method === 'POST' && request.path === '/api/memes' && request.body.title === 'generated story')).toBe(true))
    /* the mint moment: the finished card is held with its share link, and the user opens it */
    await expect(await canvas.findByRole('heading', { name: /Minted/ })).toBeInTheDocument()
    await expect(canvas.getByRole('textbox', { name: 'Share link' })).toHaveValue(`${window.location.origin}/m/meme-minted`)
    await userEvent.click(canvas.getByRole('link', { name: 'Open the card' }))
    await waitFor(() => expect(canvas.getByRole('status', { name: 'Current route' })).toHaveTextContent('/m/meme-minted'))
    await expect(loaded.scenario.unexpected).toEqual([])
  },
}

export const GiphyKeyboardSearchPickAndMint: Story = {
  ...connected,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /From Giphy/ }))
    const query = canvas.getByRole('searchbox', { name: 'Search GIPHY' })
    await userEvent.type(query, 'keyboard cat{Enter}')
    const pick = await canvas.findByRole('button', { name: giphyCat.title })
    await userEvent.click(pick)
    await expect(pick).toHaveAttribute('aria-pressed', 'true')
    const title = canvas.getByRole('textbox', { name: 'Title' })
    await userEvent.clear(title)
    await userEvent.type(title, 'giphy story')
    const mintButton = canvas.getByRole('button', { name: /Mint/ })
    await expect(mintButton).toBeEnabled()
    await userEvent.click(mintButton)
    await waitFor(() => expect(loaded.scenario.requests.filter((request: { method: string; path: string }) => request.method === 'POST' && request.path === '/api/memes')).toHaveLength(1))
    const mint = loaded.scenario.requests.find((request: { method: string; path: string }) => request.method === 'POST' && request.path === '/api/memes')
    await expect(mint?.body).toMatchObject({ title: 'giphy story', source: { provider: 'giphy', id: giphyCat.id } })
  },
}

export const MockedUploadAndMint: Story = {
  ...connected,
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Upload/ }))
    const file = new File(['story image'], 'story.png', { type: 'image/png' })
    await userEvent.upload(canvas.getByLabelText('Image'), file)
    await expect(await canvas.findByRole('img', { name: /^Preview of/ })).toHaveAttribute('src', loaded.scenario.uploadedImage)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Title' }), 'upload story')
    await userEvent.click(canvas.getByRole('button', { name: /Mint/ }))
    await waitFor(() => expect(loaded.scenario.requests.some((request: { method: string; path: string }) => request.method === 'PUT' && request.path === '/story')).toBe(true))
  },
}

export const GenerationFailure: Story = {
  loaders: [connectedLoader({ failures: { 'POST /api/aigen/image': { error: 'credits exhausted', status: 402 } } })],
  beforeEach: async (context) => connectedBeforeEach(context),
  render: (_args, { loaded }) => <ConnectedStory scenario={loaded.scenario}><CreateMemeView /></ConnectedStory>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: /^Prompt/ }), 'fail')
    await userEvent.click(canvas.getByRole('button', { name: 'Render the image' }))
    const alert = await canvas.findByRole('alert')
    await waitFor(() => expect(alert).toHaveTextContent('credits exhausted'))
    await expect(alert).toHaveTextContent('Top up Masky credits')
  },
}
