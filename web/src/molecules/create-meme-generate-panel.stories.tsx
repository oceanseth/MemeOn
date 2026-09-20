import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { createMemeCopy as copy } from '../copy/createMeme'
import { buildCreateMemeScreenModel, type CreateMemeScreenActions } from '../lib/createMemeModel'
import type { CreateMemeContext, CreateMemePhase } from '../stores/createMemeMachine'
import {
  CreateMemeGeneratePanel,
  type CreateMemeGeneratePanelProps,
} from '@/molecules/create-meme-generate-panel'

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
}

function panel(
  context: Partial<CreateMemeContext> = {},
  phase: CreateMemePhase = context.mode ?? 'generate',
): CreateMemeGeneratePanelProps {
  const model = buildCreateMemeScreenModel(phase, { ...baseContext, ...context }, actions)
  return {
    promptLabel: model.promptLabel,
    generatePromptPlaceholder: model.generatePromptPlaceholder,
    generatePromptHelpText: model.generatePromptHelpText,
    generateButtonLabel: model.generateButtonLabel,
    creditsNote: model.creditsNote,
    promptHelpId: model.helpIds.prompt,
    generatePromptTextareaProps: model.generatePromptTextareaProps,
    generateButtonProps: model.generateButtonProps,
  }
}

const meta = {
  title: 'Molecules/CreateMemeGeneratePanel',
  component: CreateMemeGeneratePanel,
  args: panel(),
} satisfies Meta<typeof CreateMemeGeneratePanel>

export default meta
type Story = StoryObj<typeof meta>

export const Generate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(copy.form.promptLabel)).toBeVisible()
    await expect(canvas.getByRole('button', { name: copy.generate.renderImage })).toBeDisabled()
    await expect(canvas.getByText(copy.form.creditsNote)).toBeVisible()
  },
}

/** Same panel, video mode: the render label is the only product difference. */
export const Video: Story = {
  args: panel({ mode: 'video' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: copy.generate.renderVideo })).toBeDisabled()
  },
}
