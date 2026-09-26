import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { paperMeme, videoMeme } from '../../.storybook/fixtures'
import { createMemeCopy as copy } from '../copy/createMeme'
import { buildCreateMemeScreenModel, type CreateMemeScreenActions } from '../lib/createMemeModel'
import type { CreateMemeContext, CreateMemePhase } from '../stores/createMemeMachine'
import {
  CreateMemeRemixPanel,
  type CreateMemeRemixPanelProps,
} from '@/molecules/create-meme-remix-panel'

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
  mode: 'remix',
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

function panel(
  context: Partial<CreateMemeContext> = {},
  phase: CreateMemePhase = context.mode ?? 'remix',
): CreateMemeRemixPanelProps {
  const model = buildCreateMemeScreenModel(phase, { ...baseContext, ...context }, actions)
  const source = model.remixSource
  return {
    remixSource: source,
    remixSourceLoadingText: model.remixSourceLoadingText,
    remixingPrefix: model.remixingPrefix,
    remixingBy: model.remixingBy,
    sourceLink: source ? <a href={String(source.linkProps.to)}>"{source.title}"</a> : null,
    remixOutputLabel: model.remixOutputLabel,
    remixOutputSelectProps: model.remixOutputSelectProps,
    showVideoRemixStyle: model.showVideoRemixStyle,
    videoRemixStyleLabel: model.videoRemixStyleLabel,
    videoModeSelectProps: model.videoModeSelectProps,
    remixPromptLabel: model.remixPromptLabel,
    remixPromptTextareaProps: model.remixPromptTextareaProps,
    remixPromptPlaceholder: model.remixPromptPlaceholder,
    showEditedFrameApproval: model.showEditedFrameApproval,
    approvalTitle: model.approvalTitle,
    approvalBody: model.approvalBody,
    motionLabel: model.motionLabel,
    motionPromptTextareaProps: model.motionPromptTextareaProps,
    motionPromptPlaceholder: model.motionPromptPlaceholder,
    animateEditedButtonProps: model.animateEditedButtonProps,
    animateEditedLabel: model.animateEditedLabel,
    rerunEditButtonProps: model.rerunEditButtonProps,
    rerunEditLabel: model.rerunEditLabel,
    showRemixButton: model.showRemixButton,
    remixButtonProps: model.remixButtonProps,
    remixButtonLabel: model.remixButtonLabel,
    creditsNote: model.creditsNote,
  }
}

const meta = {
  title: 'Molecules/CreateMemeRemixPanel',
  component: CreateMemeRemixPanel,
  args: panel({ remixId: paperMeme.id }),
} satisfies Meta<typeof CreateMemeRemixPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(copy.remix.loadingSource)).toBeVisible()
  },
}

export const Ready: Story = {
  args: panel({ remixId: paperMeme.id, remixSource: paperMeme }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(copy.remix.remixing, { exact: false })).toBeVisible()
    await expect(canvas.getByRole('link', { name: `"${paperMeme.title}"` })).toHaveAttribute(
      'href',
      `/m/${paperMeme.id}`,
    )
    await expect(canvas.getByRole('button', { name: copy.remix.remixImage })).toBeDisabled()
  },
}

export const EditedFrame: Story = {
  args: panel({
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
    await expect(canvas.getByRole('button', { name: copy.remix.animateIt })).toBeEnabled()
    await expect(canvas.getByRole('button', { name: copy.remix.rerunEdit })).toBeEnabled()
    await expect(canvas.queryByRole('button', { name: copy.remix.remixVideo })).toBeNull()
  },
}

/** Companion to Screens/CreateMemeScreen `Remix video ready to mint` — panel chrome only. */
export const VideoReady: Story = {
  args: panel({
    remixId: videoMeme.id,
    remixSource: videoMeme,
    remixOutput: 'video',
    imageUrl: videoMeme.imageUrl,
    videoUrl: videoMeme.videoUrl ?? '/animated.mp4',
    title: 'moving paper',
    prompt: 'add a claude icon',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: copy.remix.remixVideo })).toBeEnabled()
    await expect(canvas.queryByRole('button', { name: copy.remix.animateIt })).toBeNull()
  },
}
