import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { expect, fn, userEvent, within } from 'storybook/test'
import {
  giphyCat,
  giphyCategories,
  giphyDog,
  paperMeme,
  videoMeme,
} from '../../.storybook/fixtures'
import {
  buildCreateMemeScreenModel,
  type CreateMemeScreenActions,
} from '../hooks/useCreateMemeScreen'
import type { CreateMemeContext, CreateMemePhase } from '../stores/createMemeMachine'
import { CreateMemeScreen } from './CreateMemeScreen'

const actions = {
  selectMode: fn(),
  setTitle: fn(),
  setTags: fn(),
  setPrompt: fn(),
  setRemixOutput: fn(),
  setVideoMode: fn(),
  setMotionPrompt: fn(),
  setGiphyQuery: fn(),
  searchGiphy: fn(),
  pickGiphy: fn(),
  setUrl: fn(),
  resolvePageUrl: fn(),
  applyGiphyEdit: fn(),
  applyUrlEdit: fn(),
  uploadImage: fn(),
  uploadVideo: fn(),
  remix: fn(),
  animateEdited: fn(),
  generate: fn(),
  mint: fn(),
} satisfies CreateMemeScreenActions

const baseContext: CreateMemeContext = {
  remixId: null,
  mode: 'generate',
  remixSource: null,
  remixOutput: 'image',
  videoMode: 'edit',
  motionPrompt: '',
  editedFrame: null,
  title: '',
  tags: '',
  prompt: '',
  imageUrl: '',
  videoUrl: '',
  busy: null,
  err: null,
  giphyCategories: [],
  giphyQuery: '',
  giphyResults: [],
  giphyPick: null,
  edited: false,
  resolvedSource: null,
  mintedId: null,
}

function model(
  context: Partial<CreateMemeContext> = {},
  phase: CreateMemePhase = context.mode ?? baseContext.mode,
) {
  return buildCreateMemeScreenModel(phase, { ...baseContext, ...context }, actions)
}

const meta = {
  title: 'Screens/CreateMemeScreen',
  component: CreateMemeScreen,
  args: model(),
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof CreateMemeScreen>

export default meta
type Story = StoryObj<typeof meta>

export const ChooseMode: Story = { name: 'Choose mode (transient)', args: model({}, 'chooseMode') }

export const Generate: Story = { args: model() }

export const Video: Story = { args: model({ mode: 'video' }) }

export const Url: Story = { args: model({ mode: 'url' }) }

export const Upload: Story = {
  args: model({ mode: 'upload' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const image = new File(['image'], 'cat.png', { type: 'image/png' })
    const video = new File(['video'], 'cat.mp4', { type: 'video/mp4' })
    await userEvent.upload(canvas.getByLabelText(/^Image \(optional/), image)
    await userEvent.upload(canvas.getByLabelText(/^Video \(optional/), video)
    await expect(actions.uploadImage).toHaveBeenCalledWith(image)
    await expect(actions.uploadVideo).toHaveBeenCalledWith(video)
  },
}

export const RemixLoading: Story = {
  args: model({ mode: 'remix', remixId: paperMeme.id }),
}

export const RemixReady: Story = {
  args: model({ mode: 'remix', remixId: paperMeme.id, remixSource: paperMeme }),
}

export const RemixEditedFrame: Story = {
  args: model({
    mode: 'remix',
    remixId: videoMeme.id,
    remixSource: videoMeme,
    remixOutput: 'video',
    videoMode: 'edit',
    editedFrame: paperMeme.imageUrl,
    imageUrl: paperMeme.imageUrl,
    title: 'moving paper',
    prompt: 'add a claude icon',
  }),
}

export const GiphyBrowse: Story = {
  args: model({ mode: 'giphy', giphyCategories }),
}

export const GiphyResults: Story = {
  args: model({
    mode: 'giphy',
    giphyCategories,
    giphyQuery: 'cat',
    giphyResults: [giphyCat, giphyDog],
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const search = canvas.getByRole('searchbox', { name: 'Search Giphy' })
    search.focus()
    await userEvent.keyboard('{Enter}')
    await expect(actions.searchGiphy).toHaveBeenCalledWith('cat')

    const result = canvas.getByRole('button', { name: giphyCat.title })
    await expect(result).toHaveAttribute('aria-pressed', 'false')
    result.focus()
    await userEvent.keyboard('{Enter}')
    await expect(actions.pickGiphy).toHaveBeenCalledWith(giphyCat)
  },
}

export const GiphyPicked: Story = {
  args: model({
    mode: 'giphy',
    giphyCategories,
    giphyQuery: 'cat',
    giphyResults: [giphyCat, giphyDog],
    giphyPick: giphyCat,
    imageUrl: giphyCat.gifUrl,
    title: 'cat keyboard',
  }),
}

export const Submitting: Story = {
  args: model(
    {
      prompt: 'a capybara in a business suit',
      busy: 'Rendering your masterpiece (uses your Masky credits)…',
    },
    'submitting',
  ),
}

export const Error: Story = {
  args: model(
    { prompt: 'a capybara in a business suit', err: 'generation failed' },
    'error',
  ),
}

export const Success: Story = {
  name: 'Success (before navigation)',
  args: model(
    {
      title: 'fresh paper',
      imageUrl: paperMeme.imageUrl,
      prompt: 'a capybara in a business suit',
    },
    'success',
  ),
}
