import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  HTMLAttributes,
  ImgHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  VideoHTMLAttributes,
} from 'react'
import type { LinkProps } from 'react-router-dom'
import type { GiphyResult } from '../types'
import type {
  CreateMemeMode,
  CreateMemePhase,
  RemixOutput,
  ResolvedSource,
  VideoRemixStyle,
} from '../../stores/createMemeMachine'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>
type InputProps = InputHTMLAttributes<HTMLInputElement>
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

/**
 * The `Select` atom is controlled by value rather than by a change event, so a picker's model is a
 * value plus the callback that receives the next one. The option copy stays in the screen with the
 * rest of the words.
 */
export interface CreateMemeSelectModel {
  value: string
  disabled?: boolean
  onValueChange: (value: string | null) => void
}

export interface CreateMemeSourceModel {
  imageProps: ImgHTMLAttributes<HTMLImageElement>
  linkProps: Pick<LinkProps, 'to'>
  title: string
  creatorName: string
}

export interface SelectedGiphyModel {
  title: string
  authorLabel: string | null
}

/** A Giphy result is a real button around a real image, so the browser owns the keyboard behaviour. */
export interface GiphyCellModel {
  buttonProps: ButtonProps
  imageProps: ImgHTMLAttributes<HTMLImageElement>
  /** Semantic state, not a class name: the screen owns the picked chrome. */
  picked: boolean
}

/** One source chip. The engine names the state; the screen picks the chrome for it. */
export interface CreateMemeModeButtonModel {
  buttonProps: ButtonProps
  selected: boolean
}

export type CreateMemeMediaModel =
  | { kind: 'image'; imageProps: ImgHTMLAttributes<HTMLImageElement> }
  | { kind: 'video'; videoProps: VideoHTMLAttributes<HTMLVideoElement> }

/** The meme as it will ship: the same card the marketplace renders, assembled while you type. */
export interface CreateMemeCardModel {
  cardProps: HTMLAttributes<HTMLDivElement>
  media: CreateMemeMediaModel
  title: string
  titleIsPlaceholder: boolean
  /** the tier's product name on its own — what the `TierChip` prints */
  tierName: string
  /** the tier and what it means for a card this new: "Paper · freshly minted" */
  tierLabel: string
  tierColor: string
  statsLabel: string
  valueLabel: string
  originLabel: string | null
}

export interface CreateMemeScreenModel {
  phase: CreateMemePhase
  mode: CreateMemeMode
  showRemixModeButton: boolean
  modeGroupProps: HTMLAttributes<HTMLDivElement>
  busy: string | null
  busyElapsedLabel: string | null
  err: string | null
  errorNextStep: string | null
  remixSource: CreateMemeSourceModel | null
  remixSourceLoadingText: string
  giphyCategories: string[]
  giphyResults: GiphyResult[]
  giphyPick: SelectedGiphyModel | null
  giphyStatusText: string
  remixPromptLabel: string
  remixPromptPlaceholder: string
  generatePromptPlaceholder: string
  generatePromptHelpText: string
  remixButtonLabel: string
  generateButtonLabel: string
  fetchUrlButtonLabel: string
  mintHint: string
  titlePlaceholder: string
  titleHelpText: string
  titleCounterLabel: string
  tagsPlaceholder: string
  tagsHelpText: string
  tagsCounterLabel: string
  urlPlaceholder: string
  urlHelpText: string
  uploadImageHelpText: string
  uploadVideoHelpText: string
  helpIds: {
    title: string
    tags: string
    url: string
    prompt: string
    uploadImage: string
    uploadVideo: string
  }
  showRemixPanel: boolean
  showGiphyPanel: boolean
  showUrlPanel: boolean
  showUploadPanel: boolean
  showGeneratePanel: boolean
  showVideoRemixStyle: boolean
  showEditedFrameApproval: boolean
  showRemixButton: boolean
  showGiphyResults: boolean
  showGiphyPick: boolean
  showGiphyRemixButton: boolean
  showUrlApplyEdit: boolean
  showBusy: boolean
  showErr: boolean
  /** Results are on screen, so the panel's status line only has to reach a screen reader. */
  giphyStatusHidden: boolean
  showPreviewCard: boolean
  showPreviewSkeleton: boolean
  showMintHint: boolean
  showSuccess: boolean
  formProps: HTMLAttributes<HTMLDivElement>
  getModeButtonProps: (mode: CreateMemeMode) => CreateMemeModeButtonModel
  titleInputProps: InputProps
  tagsInputProps: InputProps
  remixOutputSelectProps: CreateMemeSelectModel
  videoModeSelectProps: CreateMemeSelectModel
  remixPromptTextareaProps: TextareaProps
  motionPromptTextareaProps: TextareaProps
  animateEditedButtonProps: ButtonProps
  rerunEditButtonProps: ButtonProps
  remixButtonProps: ButtonProps
  giphyCategorySelectProps: CreateMemeSelectModel
  giphyQueryInputProps: InputProps
  giphySearchButtonProps: ButtonProps
  getGiphyResultProps: (result: GiphyResult) => GiphyCellModel
  giphyPromptTextareaProps: TextareaProps
  applyGiphyEditButtonProps: ButtonProps
  urlInputProps: InputProps
  fetchUrlButtonProps: ButtonProps
  urlPromptTextareaProps: TextareaProps
  applyUrlEditButtonProps: ButtonProps
  imageFileInputProps: InputProps
  uploadImageLabel: string
  videoFileInputProps: InputProps
  uploadVideoLabel: string
  generatePromptTextareaProps: TextareaProps
  generateButtonProps: ButtonProps
  mintButtonProps: ButtonProps
  /** Persistent live regions, mounted empty: the text swaps, the element never remounts. */
  busyNoticeProps: HTMLAttributes<HTMLDivElement>
  errorNoticeProps: HTMLAttributes<HTMLDivElement>
  giphyStatusProps: HTMLAttributes<HTMLDivElement>
  previewCard: CreateMemeCardModel
  successCard: CreateMemeCardModel
  /** the mint's own live-region line: '' while composing, so the region is already in the DOM */
  mintStatus: string
  successHeading: string
  successBody: string
  copyShareLinkLabel: string
  copyShareLinkButtonProps: ButtonProps
  shareUrlInputProps: InputProps
  openMintedLinkProps: Pick<LinkProps, 'to'>
}

type MaybeAsyncAction = () => void | Promise<void>

export interface CreateMemeScreenActions {
  selectMode: (mode: CreateMemeMode) => void
  setTitle: (title: string) => void
  setTags: (tags: string) => void
  setPrompt: (prompt: string) => void
  setRemixOutput: (output: RemixOutput) => void
  setVideoMode: (mode: VideoRemixStyle) => void
  setMotionPrompt: (prompt: string) => void
  setGiphyQuery: (query: string) => void
  searchGiphy: (query: string) => void | Promise<void>
  pickGiphy: (result: GiphyResult) => void
  setUrl: (url: string) => void
  resolvePageUrl: MaybeAsyncAction
  applyGiphyEdit: MaybeAsyncAction
  applyUrlEdit: MaybeAsyncAction
  uploadImage: (file: File) => void | Promise<void>
  uploadVideo: (file: File) => void | Promise<void>
  remix: MaybeAsyncAction
  animateEdited: MaybeAsyncAction
  generate: MaybeAsyncAction
  mint: MaybeAsyncAction
  copyShareLink: MaybeAsyncAction
}

export type { ChangeEvent, ResolvedSource, RemixOutput, VideoRemixStyle }
