import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { createMemeCopy as copy } from '../copy/createMeme'
import { buildCreateMemeScreenModel, type CreateMemeScreenActions } from '../lib/createMemeModel'
import type { CreateMemeContext, CreateMemePhase } from '../stores/createMemeMachine'
import {
  CreateMemeUploadPanel,
  type CreateMemeUploadPanelProps,
} from '@/molecules/create-meme-upload-panel'

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
  mode: 'upload',
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
}

function panel(
  context: Partial<CreateMemeContext> = {},
  phase: CreateMemePhase = context.mode ?? 'upload',
): CreateMemeUploadPanelProps {
  const model = buildCreateMemeScreenModel(phase, { ...baseContext, ...context }, actions)
  return {
    uploadImageLabel: model.uploadImageLabel,
    uploadImageHelpText: model.uploadImageHelpText,
    imageFileDropProps: model.imageFileDropProps,
    uploadImageHelpId: model.helpIds.uploadImage,
    uploadVideoLabel: model.uploadVideoLabel,
    uploadVideoHelpText: model.uploadVideoHelpText,
    videoFileDropProps: model.videoFileDropProps,
    uploadVideoHelpId: model.helpIds.uploadVideo,
  }
}

const meta = {
  title: 'Molecules/CreateMemeUploadPanel',
  component: CreateMemeUploadPanel,
  args: panel(),
} satisfies Meta<typeof CreateMemeUploadPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const image = new File(['image'], 'cat.png', { type: 'image/png' })
    const video = new File(['video'], 'cat.mp4', { type: 'video/mp4' })
    await userEvent.upload(canvas.getByLabelText(copy.upload.imageLabel), image)
    await userEvent.upload(canvas.getByLabelText(copy.upload.videoLabel), video)
    await expect(actions.uploadImage).toHaveBeenCalledWith(image)
    await expect(actions.uploadVideo).toHaveBeenCalledWith(video)
  },
}

export const Picked: Story = {
  args: panel({
    imageUrl: '/cat.png',
    imageFileName: 'cursed-capybara.png',
    title: 'cursed capybara',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('cursed-capybara.png')).toBeVisible()
  },
}
