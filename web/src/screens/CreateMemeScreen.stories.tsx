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
import { createMemeCopy as copy } from '../copy/createMeme'
import {
  buildCreateMemeScreenModel,
  MAX_VIDEO_BYTES,
  overCapMessage,
  type CreateMemeScreenActions,
} from '../lib/createMemeModel'
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
  copyShareLink: fn(),
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
  urlDraft: '',
  imageUrl: '',
  videoUrl: '',
  busy: null,
  busyElapsed: null,
  err: null,
  giphyCategories: [],
  giphyQuery: '',
  giphyResults: [],
  giphySearched: false,
  giphyPick: null,
  edited: false,
  artworkSource: null,
  mintedId: null,
  shareUrl: '',
  shareCopied: false,
}

function model(
  context: Partial<CreateMemeContext> = {},
  phase: CreateMemePhase = context.mode ?? baseContext.mode,
) {
  return buildCreateMemeScreenModel(phase, { ...baseContext, ...context }, actions)
}

/** the 390 × 844 twin every screen in this swarm carries beside its desktop story */
const phone = {
  parameters: {
    viewport: {
      options: { phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } } },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
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

export const UrlTyped: Story = {
  name: 'URL typed, not fetched yet',
  args: model({ mode: 'url', urlDraft: 'https://www.reddit.com/r/memes/comments/abc' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Fetch image' })).toBeEnabled()
    /* nothing is resolved yet, so the terminal action stays shut */
    await expect(canvas.getByRole('button', { name: /Mint/ })).toBeDisabled()
    await expect(canvas.getByText(/To mint:/)).toHaveTextContent('add artwork')
  },
}

export const Upload: Story = {
  args: model({ mode: 'upload' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const image = new File(['image'], 'cat.png', { type: 'image/png' })
    const video = new File(['video'], 'cat.mp4', { type: 'video/mp4' })
    await userEvent.upload(canvas.getByLabelText('Image'), image)
    await userEvent.upload(canvas.getByLabelText('Video'), video)
    await expect(actions.uploadImage).toHaveBeenCalledWith(image)
    await expect(actions.uploadVideo).toHaveBeenCalledWith(video)
  },
}

export const UploadTooBig: Story = {
  name: 'Upload over the cap',
  args: model({
    mode: 'upload',
    err: overCapMessage('video', 143 * 1024 * 1024, MAX_VIDEO_BYTES),
  }),
}

export const RemixLoading: Story = {
  args: model({ mode: 'remix', remixId: paperMeme.id }),
}

export const RemixReady: Story = {
  args: model({ mode: 'remix', remixId: paperMeme.id, remixSource: paperMeme }),
}

export const RemixEditedFrame: Story = {
  name: 'Remix — frame awaiting approval',
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    /* exactly one primary and one secondary: the frame-destroying remix button is gone */
    await expect(canvas.getByRole('button', { name: /animate it/ })).toBeEnabled()
    await expect(canvas.getByRole('button', { name: /Re-run the edit/ })).toBeEnabled()
    await expect(canvas.queryByRole('button', { name: 'Remix into video' })).toBeNull()
    /* "New video" was chosen, so a still frame is not mintable yet */
    await expect(canvas.getByRole('button', { name: /Mint/ })).toBeDisabled()
    await expect(canvas.getByText(/To mint:/)).toHaveTextContent('animate the frame')
  },
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
    giphySearched: true,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const search = canvas.getByRole('searchbox', { name: 'Search GIPHY' })
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

export const GiphyEmpty: Story = {
  name: 'Giphy — nothing found',
  args: model({
    mode: 'giphy',
    giphyCategories,
    giphyQuery: 'zzzzzz',
    giphySearched: true,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    /* an empty search is an empty state, never a red alert: the alert region is mounted and silent */
    await expect(canvas.getByRole('alert')).toBeEmptyDOMElement()
    /* the mint's own live region is always mounted, so name the panel's status by its text */
    await expect(canvas.getByText(/Nothing for "zzzzzz"/)).toHaveAttribute('role', 'status')
  },
}

export const GiphyPicked: Story = {
  args: model({
    mode: 'giphy',
    giphyCategories,
    giphyQuery: 'cat',
    giphyResults: [giphyCat, giphyDog],
    giphySearched: true,
    giphyPick: giphyCat,
    imageUrl: giphyCat.gifUrl,
    artworkSource: {
      provider: 'giphy',
      id: giphyCat.id,
      url: giphyCat.url,
      author: giphyCat.author,
    },
    title: 'cat keyboard',
  }),
}

export const GiphyArtworkInUploadMode: Story = {
  name: 'Giphy artwork carried into Upload',
  args: model({
    mode: 'upload',
    giphyQuery: 'cat',
    giphyPick: giphyCat,
    imageUrl: giphyCat.gifUrl,
    artworkSource: {
      provider: 'giphy',
      id: giphyCat.id,
      url: giphyCat.url,
      author: giphyCat.author,
    },
    title: 'cat keyboard',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    /* the origin travels with the artwork, so the attribution is never silently dropped */
    await expect(canvas.getByText('from GIPHY · @giphy-user')).toBeVisible()
  },
}

export const TitleAtLimit: Story = {
  args: model({
    title: 'twenty characters ok',
    tags: 'animals, chaos, cursed',
    prompt: 'a capybara in a business suit',
    imageUrl: paperMeme.imageUrl,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('20 / 20')).toBeVisible()
    await expect(canvas.getByText('3 / 5')).toBeVisible()
  },
}

export const Submitting: Story = {
  args: model(
    {
      prompt: 'a capybara in a business suit',
      busy: copy.busy.generatingImage,
      busyElapsed: '12s',
    },
    'submitting',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    /* the mode row locks with the rest of the form: no reshaping a running request */
    await expect(canvas.getByRole('button', { name: /Upload/ })).toBeDisabled()
    /* the busy text lands in a region that was already mounted and silent, not one inserted with it */
    const busyNotice = canvas
      .getByText(copy.busy.generatingImage)
      .closest('[data-slot="live-region"]')
    await expect(busyNotice).toHaveAttribute('role', 'status')
    await expect(busyNotice).toHaveTextContent('12s')
  },
}

export const RenderingVideo: Story = {
  name: 'Rendering video (elapsed + reserved slot)',
  args: model(
    {
      mode: 'video',
      prompt: 'a capybara in a business suit',
      busy: copy.busy.renderingVideo,
      busyElapsed: '2m41s',
    },
    'submitting',
  ),
}

export const ResumedRender: Story = {
  name: 'Resumed render (draft restored)',
  args: model(
    {
      mode: 'video',
      title: 'burning office',
      tags: 'chaos, work',
      prompt: 'a capybara ignoring a burning office',
      imageUrl: paperMeme.imageUrl,
      busy: copy.busy.resumingRender,
      busyElapsed: '4m08s',
    },
    'submitting',
  ),
}

export const Error: Story = {
  args: model(
    { prompt: 'a capybara in a business suit', err: 'credits exhausted' },
    'error',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('Top up Masky credits')
  },
}

export const Success: Story = {
  name: 'Success (minted)',
  args: model(
    {
      title: 'fresh paper',
      imageUrl: paperMeme.imageUrl,
      prompt: 'a capybara in a business suit',
      mintedId: 'meme-minted',
      shareUrl: 'https://memeon.ai/m/meme-minted',
    },
    'success',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // the render can run minutes: the outcome takes focus and announces itself
    await expect(canvas.getByRole('heading', { name: /Minted/ })).toHaveFocus()
    await expect(canvas.getByRole('status')).toHaveTextContent('Minted. Your card is live')
    await userEvent.click(canvas.getByRole('button', { name: /Copy share link/ }))
    await expect(actions.copyShareLink).toHaveBeenCalled()
  },
}

export const SuccessCopied: Story = {
  name: 'Success (link copied)',
  args: model(
    {
      title: 'fresh paper',
      imageUrl: paperMeme.imageUrl,
      mintedId: 'meme-minted',
      shareUrl: 'https://memeon.ai/m/meme-minted',
      shareCopied: true,
    },
    'success',
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Share link copied')
  },
}

/** the mint studio with artwork in hand: the two columns, the tier frame and the ✨ Mint pill */
export const Ready: Story = {
  name: 'Ready to mint',
  args: model({
    title: 'group chat energy',
    tags: 'work, internet',
    prompt: 'a possum in a tiny office, taking a very serious call, flash',
    imageUrl: paperMeme.imageUrl,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /Mint/ })).toBeEnabled()
    const tierNote = canvasElement.querySelector('[data-slot="tier-note"]') as HTMLElement
    await expect(within(tierNote).getByText('Paper')).toBeVisible()
    await expect(within(tierNote).getByText('freshly minted')).toBeVisible()
  },
}

export const Dark: Story = { ...Ready, name: 'Ready dark', globals: { theme: 'dark' } }

export const Phone390: Story = { ...Ready, name: 'Ready phone 390', ...phone }

export const DarkPhone390: Story = {
  ...Ready,
  name: 'Ready dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}

export const SubmittingDark: Story = {
  name: 'Rendering dark (state card)',
  args: Submitting.args,
  globals: { theme: 'dark' },
}

export const SuccessPhone390: Story = { ...Success, name: 'Success phone 390', ...phone }
