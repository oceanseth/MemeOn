import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { giphyCat, giphyCategories, giphyDog } from '../../.storybook/fixtures'
import { createMemeCopy as copy } from '../copy/createMeme'
import {
  buildCreateMemeScreenModel,
  type CreateMemeScreenActions,
} from '../lib/createMemeModel'
import type { CreateMemeContext, CreateMemePhase } from '../stores/createMemeMachine'
import {
  CreateMemeGiphyPanel,
  type CreateMemeGiphyPanelProps,
} from '@/molecules/create-meme-giphy-panel'

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
  mode: 'giphy',
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
  phase: CreateMemePhase = context.mode ?? 'giphy',
): CreateMemeGiphyPanelProps {
  const model = buildCreateMemeScreenModel(phase, { ...baseContext, ...context }, actions)
  return {
    giphyCategoryLabel: model.giphyCategoryLabel,
    giphyCategorySelectProps: model.giphyCategorySelectProps,
    giphySearchLabel: model.giphySearchLabel,
    giphyQueryInputProps: model.giphyQueryInputProps,
    giphyQueryPlaceholder: model.giphyQueryPlaceholder,
    giphySearchButtonProps: model.giphySearchButtonProps,
    giphySearchButtonLabel: model.giphySearchButtonLabel,
    giphyPoweredBy: model.giphyPoweredBy,
    showGiphyResults: model.showGiphyResults,
    giphyResults: model.giphyResults,
    getGiphyResultProps: model.getGiphyResultProps,
    giphyStatusHidden: model.giphyStatusHidden,
    giphyStatusProps: model.giphyStatusProps,
    giphyStatusText: model.giphyStatusText,
    showGiphyPick: model.showGiphyPick,
    giphyPick: model.giphyPick,
    giphySelectedPrefix: model.giphySelectedPrefix,
    giphyPickSuffix: model.giphyPickSuffix,
    giphyOptionalPromptLabel: model.giphyOptionalPromptLabel,
    giphyPromptTextareaProps: model.giphyPromptTextareaProps,
    giphyRemixPlaceholder: model.giphyRemixPlaceholder,
    showGiphyRemixButton: model.showGiphyRemixButton,
    applyGiphyEditButtonProps: model.applyGiphyEditButtonProps,
    giphyRemixButtonLabel: model.giphyRemixButtonLabel,
    creditsNote: model.creditsNote,
  }
}

const meta = {
  title: 'Molecules/CreateMemeGiphyPanel',
  component: CreateMemeGiphyPanel,
  args: panel({ giphyCategories }),
} satisfies Meta<typeof CreateMemeGiphyPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Browse: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(copy.giphy.poweredBy)).toBeVisible()
    await expect(canvas.getByText(copy.giphy.idle)).toBeVisible()
  },
}

export const Results: Story = {
  args: panel({
    giphyCategories,
    giphyQuery: 'cat',
    giphyResults: [giphyCat, giphyDog],
    giphySearched: true,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const search = canvas.getByRole('searchbox', { name: copy.giphy.searchLabel })
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

export const EmptySearch: Story = {
  args: panel({
    giphyCategories,
    giphyQuery: 'zzzzzz',
    giphySearched: true,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText(copy.giphy.emptySearch('zzzzzz')).closest('[data-slot="empty"]'),
    ).toHaveAttribute('role', 'status')
  },
}

export const Picked: Story = {
  args: panel({
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(copy.giphy.selected, { exact: false })).toBeVisible()
    await expect(canvas.getByRole('button', { name: giphyCat.title })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.queryByRole('button', { name: copy.giphy.remixWithMasky })).toBeNull()
  },
}
