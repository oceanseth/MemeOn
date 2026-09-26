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
  imageFileName: null,
  videoFileName: null,
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
  shareCopyFailed: false,
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
      options: {
        phone390: {
          name: 'Phone 390',
          styles: { width: '390px', height: '844px' },
        },
      },
    },
  },
  globals: { viewport: { value: 'phone390', isRotated: false } },
}

const meta = {
  title: 'Screens/CreateMemeScreen',
  component: CreateMemeScreen,
  args: model(),
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof CreateMemeScreen>

export default meta
type Story = StoryObj<typeof meta>

export const ChooseMode: Story = {
  name: 'Choose mode (transient)',
  args: model({}, 'chooseMode'),
}

export const Generate: Story = { args: model() }

export const Video: Story = { args: model({ mode: 'video' }) }

export const Url: Story = { args: model({ mode: 'url' }) }

export const UrlTyped: Story = {
  name: 'URL typed, not fetched yet',
  args: model({
    mode: 'url',
    urlDraft: 'https://www.reddit.com/r/memes/comments/abc',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: copy.url.fetch })).toBeEnabled()
    /* nothing is resolved yet, so the terminal action stays shut */
    await expect(canvas.getByRole('button', { name: copy.form.mint })).toBeDisabled()
    await expect(canvas.getByText(copy.form.toMint, { exact: false })).toHaveTextContent(
      copy.preview.mintHint.artwork,
    )
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

/** Picked: the row names the file in our own type, where the browser used to write the sentence. */
export const UploadPicked: Story = {
  name: 'Upload with a file picked',
  args: model({
    mode: 'upload',
    imageUrl: '/cat.png',
    imageFileName: 'cursed-capybara.png',
    title: 'cursed capybara',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('cursed-capybara.png')).toBeVisible()
    await expect(canvas.queryByText('No file chosen')).not.toBeInTheDocument()
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
    await expect(canvas.getByRole('button', { name: copy.remix.animateIt })).toBeEnabled()
    await expect(canvas.getByRole('button', { name: copy.remix.rerunEdit })).toBeEnabled()
    await expect(canvas.queryByRole('button', { name: copy.remix.remixVideo })).toBeNull()
    /* "New video" was chosen, so a still frame is not mintable yet */
    await expect(canvas.getByRole('button', { name: copy.form.mint })).toBeDisabled()
    await expect(canvas.getByText(copy.form.toMint, { exact: false })).toHaveTextContent(
      copy.preview.mintHint.animate,
    )
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
    const search = canvas.getByRole('searchbox', {
      name: copy.giphy.searchLabel,
    })
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
    /* an empty search is an empty state, never a red alert: the alert region is mounted and
       silent (`LiveRegion variant="visible"` keeps a silent region out of the a11y tree, so it
       is read by slot rather than by role) */
    const regions = canvasElement.querySelectorAll('[data-slot="live-region"]')
    await expect(regions[regions.length - 1]).toBeEmptyDOMElement()
    /* the mint's own live region is always mounted, so name the panel's status by its text:
       the card is the region, its description the line that swaps */
    await expect(
      canvas.getByText(/Nothing for "zzzzzz"/).closest('[data-slot="empty"]'),
    ).toHaveAttribute('role', 'status')
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

const submittingArgs = model(
  {
    prompt: 'a capybara in a business suit',
    busy: copy.busy.generatingImage,
    busyElapsed: '12s',
  },
  'submitting',
)

export const Submitting: Story = {
  args: submittingArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    /* the mode row locks with the rest of the form: no reshaping a running request */
    await expect(canvas.getByRole('button', { name: copy.modes.upload })).toBeDisabled()
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
    {
      prompt: 'a capybara in a business suit',
      err: copy.errors.creditsExhausted,
    },
    'error',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(copy.errors.creditsExhausted)
    await expect(canvas.getByRole('alert')).toHaveTextContent(copy.preview.nextStep.credits)
  },
}

export const MintFailed: Story = {
  name: 'Error (mint fallback)',
  args: model({ prompt: 'a capybara in a business suit', err: copy.errors.mintFailed }, 'error'),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(copy.errors.mintFailed)
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
    await userEvent.click(canvas.getByRole('button', { name: copy.form.success.copyLink }))
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
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Share link copied')
    const button = canvas.getByRole('button', { name: copy.form.copied })
    await expect(button).toBeVisible()
    const icon = button.querySelector('[data-slot="icon"]')
    await expect(icon).not.toBeNull()
    await expect(
      icon!.querySelector('path[d*="M7.757 12L10.409 14.652L16.243 8.818"]'),
    ).not.toBeNull()
  },
}

/** the mint studio with artwork in hand: the two columns, the tier frame and the Mint pill */
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
    await expect(canvas.getByRole('button', { name: copy.form.mint })).toBeEnabled()
    const tierNote = canvasElement.querySelector('[data-slot="tier-note"]') as HTMLElement
    await expect(within(tierNote).getByText('Paper')).toBeVisible()
    await expect(within(tierNote).getByText('freshly minted')).toBeVisible()
  },
}

export const Dark: Story = {
  ...Ready,
  name: 'Ready dark',
  globals: { theme: 'dark' },
}

export const Phone390: Story = { ...Ready, name: 'Ready phone 390', ...phone }

export const DarkPhone390: Story = {
  ...Ready,
  name: 'Ready dark phone 390',
  ...phone,
  globals: { ...phone.globals, theme: 'dark' },
}

export const SubmittingDark: Story = {
  name: 'Rendering dark (state card)',
  args: submittingArgs,
  globals: { theme: 'dark' },
}

export const SuccessPhone390: Story = {
  ...Success,
  name: 'Success phone 390',
  ...phone,
}

export const VideoReady: Story = {
  name: 'Video ready to mint',
  args: model({
    mode: 'video',
    title: 'burning office',
    imageUrl: paperMeme.imageUrl,
    videoUrl: videoMeme.videoUrl ?? '/clip.mp4',
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: copy.form.mint })).toBeEnabled()
  },
}

export const VideoError: Story = {
  name: 'Video error',
  args: model(
    {
      mode: 'video',
      prompt: 'a capybara in a business suit',
      err: copy.errors.videoGenerationFailed,
    },
    'error',
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(
      copy.errors.videoGenerationFailed,
    )
  },
}

export const UrlResolved: Story = {
  name: 'URL resolved, ready to mint',
  args: model({
    mode: 'url',
    urlDraft: 'https://www.reddit.com/r/memes/comments/abc',
    imageUrl: paperMeme.imageUrl,
    title: 'group chat energy',
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: copy.form.mint })).toBeEnabled()
  },
}

export const UrlResolveError: Story = {
  name: 'URL resolve error',
  args: model(
    {
      mode: 'url',
      urlDraft: 'https://www.reddit.com/r/memes/comments/abc',
      err: copy.errors.resolveFailed,
    },
    'error',
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(
      copy.errors.resolveFailed,
    )
  },
}

export const ResolvingPage: Story = {
  name: 'Resolving page',
  args: model(
    {
      mode: 'url',
      urlDraft: 'https://www.reddit.com/r/memes/comments/abc',
      busy: copy.busy.resolvingPage,
    },
    'submitting',
  ),
  play: async ({ canvasElement }) => {
    const busyNotice = within(canvasElement)
      .getByText(copy.busy.resolvingPage)
      .closest('[data-slot="live-region"]')
    await expect(busyNotice).toHaveAttribute('role', 'status')
  },
}

export const UploadingImage: Story = {
  name: 'Uploading image',
  args: model(
    {
      mode: 'upload',
      imageFileName: 'cursed-capybara.png',
      busy: copy.busy.uploadingImage,
    },
    'submitting',
  ),
  play: async ({ canvasElement }) => {
    const busyNotice = within(canvasElement)
      .getByText(copy.busy.uploadingImage)
      .closest('[data-slot="live-region"]')
    await expect(busyNotice).toHaveAttribute('role', 'status')
  },
}

export const RemixSourceMissing: Story = {
  name: 'Remix source missing',
  args: model({
    mode: 'remix',
    remixId: paperMeme.id,
    remixSource: null,
    err: copy.errors.remixSourceMissing,
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(
      copy.errors.remixSourceMissing,
    )
  },
}

export const RemixVideoReady: Story = {
  name: 'Remix video ready to mint',
  args: model({
    mode: 'remix',
    remixId: videoMeme.id,
    remixSource: videoMeme,
    remixOutput: 'video',
    imageUrl: videoMeme.imageUrl,
    videoUrl: videoMeme.videoUrl ?? '/animated.mp4',
    title: 'moving paper',
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: copy.form.mint })).toBeEnabled()
  },
}

export const RemixBusy: Story = {
  name: 'Remix busy',
  args: model(
    {
      mode: 'remix',
      remixId: paperMeme.id,
      remixSource: paperMeme,
      busy: copy.busy.remixImage,
    },
    'submitting',
  ),
  play: async ({ canvasElement }) => {
    const busyNotice = within(canvasElement)
      .getByText(copy.busy.remixImage)
      .closest('[data-slot="live-region"]')
    await expect(busyNotice).toHaveAttribute('role', 'status')
  },
}

export const GiphySearchFailed: Story = {
  name: 'Giphy search failed',
  args: model(
    {
      mode: 'giphy',
      giphyCategories,
      giphyQuery: 'cat',
      err: copy.errors.giphySearchFailed,
    },
    'error',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent(copy.errors.giphySearchFailed)
    /* a failed search is an alert, never the Giphy empty card */
    await expect(canvas.queryByText(copy.giphy.emptySearch('cat'))).not.toBeInTheDocument()
  },
}

export const SearchingGiphy: Story = {
  name: 'Searching Giphy',
  args: model(
    {
      mode: 'giphy',
      giphyCategories,
      giphyQuery: 'cat',
      busy: copy.busy.searchingGiphy,
    },
    'submitting',
  ),
  play: async ({ canvasElement }) => {
    const busyNotice = within(canvasElement)
      .getByText(copy.busy.searchingGiphy)
      .closest('[data-slot="live-region"]')
    await expect(busyNotice).toHaveAttribute('role', 'status')
  },
}
