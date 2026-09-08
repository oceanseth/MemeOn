import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import { fn } from 'storybook/test'
import {
  giphyCat,
  giphyCategories,
  giphyDog,
  paperMeme,
  videoMeme,
} from '../../.storybook/fixtures'
import type { CreateMemeScreenModel } from '../hooks/useCreateMemeScreen'
import { CreateMemeScreen } from './CreateMemeScreen'

const handlers = {
  onSelectMode: fn(),
  onTitleChange: fn(),
  onTagsChange: fn(),
  onPromptChange: fn(),
  onRemixOutputChange: fn(),
  onVideoModeChange: fn(),
  onMotionPromptChange: fn(),
  onGiphyQueryChange: fn(),
  onGiphySearch: fn(),
  onPickGiphy: fn(),
  onUrlChange: fn(),
  onResolvePageUrl: fn(),
  onApplyGiphyEdit: fn(),
  onApplyUrlEdit: fn(),
  onImageFile: fn(),
  onVideoFile: fn(),
  onRemix: fn(),
  onAnimateEdited: fn(),
  onGenerate: fn(),
  onMint: fn(),
} satisfies Partial<CreateMemeScreenModel>

const empty: CreateMemeScreenModel = {
  phase: 'generate',
  mode: 'generate',
  showRemixModeButton: false,
  title: '',
  tags: '',
  prompt: '',
  imageUrl: '',
  videoUrl: '',
  busy: null,
  err: null,
  remixSource: null,
  remixOutput: 'image',
  videoMode: 'edit',
  motionPrompt: '',
  editedFrame: null,
  giphyCategories: [],
  giphyQuery: '',
  giphyResults: [],
  giphyPick: null,
  remixPromptLabel: 'Edit prompt (runs on your Masky credits)',
  remixPromptPlaceholder: 'same scene but everyone is a skeleton and it is raining',
  generatePromptPlaceholder: 'a capybara in a business suit ignoring a burning office, cinematic',
  remixButtonLabel: 'Remix image',
  generateButtonLabel: 'Generate image',
  mintHint: 'add a title · add artwork',
  canMint: false,
  showRemixPanel: false,
  showGiphyPanel: false,
  showUrlPanel: false,
  showUploadPanel: false,
  showGeneratePanel: true,
  showVideoRemixStyle: false,
  showEditedFrameApproval: false,
  showGiphyResults: false,
  showGiphyPick: false,
  showGiphyRemixButton: false,
  showUrlApplyEdit: false,
  showBusy: false,
  showErr: false,
  showImagePreview: false,
  showVideoPreview: false,
  showMintHint: true,
  ...handlers,
}

const meta = {
  title: 'Screens/CreateMemeScreen',
  component: CreateMemeScreen,
  args: empty,
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
} satisfies Meta<typeof CreateMemeScreen>

export default meta
type Story = StoryObj<typeof meta>

export const ChooseMode: Story = { args: { phase: 'chooseMode' } }

export const Generate: Story = {}

export const Video: Story = {
  args: {
    phase: 'video',
    mode: 'video',
    generateButtonLabel: 'Generate video',
    mintHint: 'add a title · add artwork · finish the video',
  },
}

export const Url: Story = {
  args: {
    phase: 'url',
    mode: 'url',
    showGeneratePanel: false,
    showUrlPanel: true,
  },
}

export const Upload: Story = {
  args: {
    phase: 'upload',
    mode: 'upload',
    showGeneratePanel: false,
    showUploadPanel: true,
  },
}

export const RemixLoading: Story = {
  args: {
    phase: 'remix',
    mode: 'remix',
    showRemixModeButton: true,
    showGeneratePanel: false,
    showRemixPanel: true,
    remixSource: null,
  },
}

export const RemixReady: Story = {
  args: {
    phase: 'remix',
    mode: 'remix',
    showRemixModeButton: true,
    showGeneratePanel: false,
    showRemixPanel: true,
    remixSource: paperMeme,
  },
}

export const RemixEditedFrame: Story = {
  args: {
    phase: 'remix',
    mode: 'remix',
    showRemixModeButton: true,
    showGeneratePanel: false,
    showRemixPanel: true,
    remixSource: videoMeme,
    remixOutput: 'video',
    videoMode: 'edit',
    remixPromptLabel: 'What to change (runs on your Masky credits)',
    remixPromptPlaceholder: 'add a claude icon to the tshirt he is wearing',
    remixButtonLabel: 'Remix into video',
    showVideoRemixStyle: true,
    showEditedFrameApproval: true,
    editedFrame: paperMeme.imageUrl,
    imageUrl: paperMeme.imageUrl,
    showImagePreview: true,
    title: 'moving paper',
    prompt: 'add a claude icon',
    mintHint: 'finish the video',
  },
}

export const GiphyBrowse: Story = {
  args: {
    phase: 'giphy',
    mode: 'giphy',
    showGeneratePanel: false,
    showGiphyPanel: true,
    giphyCategories,
  },
}

export const GiphyResults: Story = {
  args: {
    phase: 'giphy',
    mode: 'giphy',
    showGeneratePanel: false,
    showGiphyPanel: true,
    giphyCategories,
    giphyQuery: 'cat',
    giphyResults: [giphyCat, giphyDog],
    showGiphyResults: true,
  },
}

export const GiphyPicked: Story = {
  args: {
    phase: 'giphy',
    mode: 'giphy',
    showGeneratePanel: false,
    showGiphyPanel: true,
    giphyCategories,
    giphyQuery: 'cat',
    giphyResults: [giphyCat, giphyDog],
    giphyPick: giphyCat,
    showGiphyResults: true,
    showGiphyPick: true,
    imageUrl: giphyCat.gifUrl,
    showImagePreview: true,
    title: 'cat keyboard',
    mintHint: '',
    canMint: true,
    showMintHint: false,
  },
}

export const Submitting: Story = {
  args: {
    phase: 'submitting',
    prompt: 'a capybara in a business suit',
    busy: 'Rendering your masterpiece (uses your Masky credits)…',
    showBusy: true,
    showMintHint: false,
  },
}

export const Error: Story = {
  args: {
    phase: 'error',
    prompt: 'a capybara in a business suit',
    err: 'generation failed',
    showErr: true,
  },
}

export const Success: Story = {
  args: {
    phase: 'success',
    title: 'fresh paper',
    imageUrl: paperMeme.imageUrl,
    showImagePreview: true,
    canMint: true,
    showMintHint: false,
    prompt: 'a capybara in a business suit',
  },
}
