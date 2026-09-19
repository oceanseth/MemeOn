import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { createMemeCopy as copy } from '../copy/createMeme'
import {
  buildCreateMemeScreenModel,
  type CreateMemeScreenActions,
} from '../lib/createMemeModel'
import type { CreateMemeContext, CreateMemePhase } from '../stores/createMemeMachine'
import {
  CreateMemeUrlPanel,
  type CreateMemeUrlPanelProps,
} from '@/molecules/create-meme-url-panel'

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
  mode: 'url',
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
  phase: CreateMemePhase = context.mode ?? 'url',
): CreateMemeUrlPanelProps {
  const model = buildCreateMemeScreenModel(phase, { ...baseContext, ...context }, actions)
  return {
    urlFieldLabel: model.urlFieldLabel,
    urlInputProps: model.urlInputProps,
    urlPlaceholder: model.urlPlaceholder,
    urlHelpText: model.urlHelpText,
    urlHelpId: model.helpIds.url,
    fetchUrlButtonProps: model.fetchUrlButtonProps,
    fetchUrlButtonLabel: model.fetchUrlButtonLabel,
    urlOptionalPromptLabel: model.urlOptionalPromptLabel,
    urlPromptTextareaProps: model.urlPromptTextareaProps,
    urlRemixPlaceholder: model.urlRemixPlaceholder,
    showUrlApplyEdit: model.showUrlApplyEdit,
    applyUrlEditButtonProps: model.applyUrlEditButtonProps,
    applyUrlEditLabel: model.applyUrlEditLabel,
    creditsNote: model.creditsNote,
  }
}

const meta = {
  title: 'Molecules/CreateMemeUrlPanel',
  component: CreateMemeUrlPanel,
  args: panel(),
} satisfies Meta<typeof CreateMemeUrlPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: copy.url.fetch })).toBeDisabled()
  },
}

export const Typed: Story = {
  args: panel({ urlDraft: 'https://www.reddit.com/r/memes/comments/abc' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: copy.url.fetch })).toBeEnabled()
    await expect(canvas.queryByRole('button', { name: copy.url.applyEdit })).toBeNull()
  },
}
