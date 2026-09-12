import { useProjectedActor } from './useProjectedActor'
import { useCallback, useRef } from 'react'
import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  HTMLAttributes,
  ImgHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  VideoHTMLAttributes,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import { glowStyleFor, tierFor } from '@memeon/shared/tiers'
import { tierFrameClasses } from '../atoms/foil'
import { apiFetch, post } from '../lib/api'
import { extractPoster } from '../lib/extractPoster'
import type { GiphyResult, Meme } from '../lib/types'
import {
  boundTitle,
  countTitle,
  createMemeMachine,
  TITLE_MAX,
  type CreateMemeContext,
  type CreateMemeDraft,
  type CreateMemeEvent,
  type CreateMemeMode,
  type CreateMemePhase,
  type RemixOutput,
  type ResolvedSource,
  type VideoRemixStyle,
} from '../stores/createMemeMachine'
import { useMountEffect } from './useMountEffect'

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

function isRemixOutput(value: string): value is RemixOutput {
  return value === 'image' || value === 'video'
}

function isVideoRemixStyle(value: string): value is VideoRemixStyle {
  return value === 'edit' || value === 'restyle'
}

function firstFile(event: ChangeEvent<HTMLInputElement>): File | null {
  return event.currentTarget.files?.[0] ?? null
}

/** Upload ceilings. The field copy and the guard read the same number, so they cannot drift. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

const megabytes = (bytes: number): number => Math.max(1, Math.round(bytes / (1024 * 1024)))

export function overCapMessage(kind: 'image' | 'video', size: number, cap: number): string {
  const advice = kind === 'video' ? 'try a shorter clip' : 'try a smaller file'
  return `that ${kind} is ${megabytes(size)}MB — the cap is ${megabytes(cap)}MB, ${advice}`
}

/** Tags are a handful of words, not a paragraph. */
export const TAGS_MAX = 5

export function boundTags(value: string): string {
  const parts = value.split(',')
  return parts.length <= TAGS_MAX ? value : parts.slice(0, TAGS_MAX).join(',')
}

const countTags = (value: string): number =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean).length

const HELP_IDS = {
  title: 'create-title-help',
  tags: 'create-tags-help',
  url: 'create-url-help',
  prompt: 'create-prompt-help',
  uploadImage: 'create-image-help',
  uploadVideo: 'create-video-help',
} as const

const FRESH_TIER = tierFor(0)

function originLabelFor(source: ResolvedSource | null): string | null {
  if (!source) return null
  const provider = source.provider === 'giphy' ? 'GIPHY' : source.provider
  return source.author ? `from ${provider} · @${source.author}` : `from ${provider}`
}

/**
 * One card recipe for both the live preview and the minted hold. The only presentation this engine
 * names is the foil effect API (`atoms/foil.css`, `atoms/foil.ts`): which tier frame to paint, and
 * the stop set that drives its ring. The box model around it belongs to `CreateMemeScreen`.
 */
function buildCard(ctx: CreateMemeContext): CreateMemeCardModel {
  const title = ctx.title.trim()
  const label = title ? `"${title}"` : 'your meme'
  return {
    cardProps: {
      /* the frame, not the legacy padding ring: the preview wears the same 3px tier border the
         grid card does, so "this is what lands in the marketplace" is literally true */
      className: tierFrameClasses(FRESH_TIER.key),
      'data-glow-style': glowStyleFor(FRESH_TIER.key),
    } as HTMLAttributes<HTMLDivElement>,
    media: ctx.videoUrl
      ? {
          kind: 'video',
          videoProps: {
            src: ctx.videoUrl,
            poster: ctx.imageUrl || undefined,
            muted: true,
            loop: true,
            playsInline: true,
            autoPlay: true,
            controls: true,
            'aria-label': 'Video preview',
          },
        }
      : {
          kind: 'image',
          imageProps: { src: ctx.imageUrl, alt: `Preview of ${label}` },
        },
    title: title || 'Untitled',
    titleIsPlaceholder: !title,
    tierName: FRESH_TIER.name,
    /* the mint copy deck (plan-buckets.md › mint): every card starts here, and says so */
    tierLabel: `${FRESH_TIER.name} · freshly minted`,
    tierColor: FRESH_TIER.color,
    statsLabel: '👁️ 0 · 🔁 0',
    valueLabel: '🧠 0',
    originLabel: originLabelFor(ctx.artworkSource),
  }
}

function nextStepFor(err: string | null): string | null {
  if (!err) return null
  if (/credit|402|quota|balance/i.test(err)) {
    return 'Top up Masky credits, or switch to Upload and bring your own image.'
  }
  if (/upload failed|413|too large/i.test(err)) return 'Try a smaller file, or a shorter clip.'
  return null
}

/** Builds the terminal contract from machine state and domain actions. */
export function buildCreateMemeScreenModel(
  phase: CreateMemePhase,
  ctx: CreateMemeContext,
  actions: CreateMemeScreenActions,
): CreateMemeScreenModel {
  const isBusy = !!ctx.busy
  const remixPromptIsPrecise = ctx.remixOutput === 'video' && ctx.videoMode === 'edit'
  /* "New video" means a video, whichever door the user came through — mints are final */
  const needsVideo = ctx.mode === 'video' || (ctx.mode === 'remix' && ctx.remixOutput === 'video')
  const canMint =
    !!ctx.title.trim() && !!ctx.imageUrl && (!needsVideo || !!ctx.videoUrl) && !isBusy
  const mintHint =
    [
      !ctx.title.trim() && 'add a title',
      !ctx.imageUrl && 'add artwork',
      needsVideo &&
        !ctx.videoUrl &&
        (ctx.mode === 'remix' ? 'animate the frame' : 'finish the video'),
    ]
      .filter(Boolean)
      .join(' · ') || '…'
  const showEditedFrameApproval =
    ctx.remixOutput === 'video' && ctx.videoMode === 'edit' && !!ctx.editedFrame && !ctx.videoUrl

  return {
    phase,
    mode: ctx.mode,
    showRemixModeButton: !!ctx.remixId,
    modeGroupProps: { role: 'group', 'aria-label': 'Source' },
    busy: ctx.busy,
    busyElapsedLabel: ctx.busyElapsed,
    err: ctx.err,
    errorNextStep: nextStepFor(ctx.err),
    remixSource: ctx.remixSource
      ? {
          imageProps: { src: ctx.remixSource.imageUrl, alt: ctx.remixSource.title },
          linkProps: { to: `/m/${ctx.remixSource.id}` },
          title: ctx.remixSource.title,
          creatorName: ctx.remixSource.creatorName,
        }
      : null,
    remixSourceLoadingText: 'Loading the meme you are remixing…',
    giphyCategories: ctx.giphyCategories,
    giphyResults: ctx.giphyResults,
    giphyPick: ctx.giphyPick
      ? {
          title: ctx.giphyPick.title,
          authorLabel: ctx.giphyPick.author ? ` (@${ctx.giphyPick.author})` : null,
        }
      : null,
    giphyStatusText:
      ctx.giphyResults.length > 0
        ? `${ctx.giphyResults.length} GIPHY results for "${ctx.giphyQuery}"`
        : ctx.giphySearched
          ? `Nothing for "${ctx.giphyQuery}" — try a broader word or pick a category.`
          : 'Pick a category or search to browse GIPHY.',
    remixPromptLabel: remixPromptIsPrecise
      ? 'What to change (runs on your Masky credits)'
      : 'Edit prompt (runs on your Masky credits)',
    remixPromptPlaceholder:
      ctx.remixOutput === 'video'
        ? ctx.videoMode === 'edit'
          ? 'add a claude icon to the tshirt he is wearing'
          : 'make the whole scene look like a vaporwave painting'
        : 'same scene but everyone is a skeleton and it is raining',
    generatePromptPlaceholder: 'a capybara in a business suit ignoring a burning office, cinematic',
    generatePromptHelpText:
      'Describe the whole scene — subject, style, chaos level. Runs on your Masky credits.',
    remixButtonLabel: ctx.remixOutput === 'video' ? 'Remix into video' : 'Remix image',
    generateButtonLabel: ctx.mode === 'video' ? 'Render the video' : 'Render the image',
    fetchUrlButtonLabel: 'Fetch image',
    mintHint,
    titlePlaceholder: 'e.g. cursed capybara',
    titleHelpText: `Up to ${TITLE_MAX} characters — it has to fit the card banner.`,
    titleCounterLabel: `${countTitle(ctx.title)} / ${TITLE_MAX}`,
    tagsPlaceholder: 'animals, chaos',
    tagsHelpText: `Up to ${TAGS_MAX} tags, comma-separated — this is how people find it.`,
    tagsCounterLabel: `${countTags(ctx.tags)} / ${TAGS_MAX}`,
    urlPlaceholder: 'https://…/meme.png',
    urlHelpText:
      'Paste a direct image link, or a giphy/imgur/reddit page — we grab the main image.',
    uploadImageHelpText: `PNG, JPG, GIF or WebP, max ${megabytes(MAX_IMAGE_BYTES)}MB. Optional for videos — we grab the first frame.`,
    uploadVideoHelpText: `MP4, MOV or WebM, max ${megabytes(MAX_VIDEO_BYTES)}MB. Adding one makes it a video meme.`,
    helpIds: HELP_IDS,
    showRemixPanel: ctx.mode === 'remix',
    showGiphyPanel: ctx.mode === 'giphy',
    showUrlPanel: ctx.mode === 'url',
    showUploadPanel: ctx.mode === 'upload',
    showGeneratePanel: ctx.mode === 'generate' || ctx.mode === 'video',
    showVideoRemixStyle: ctx.remixOutput === 'video' && ctx.remixSource?.mediaType === 'video',
    showEditedFrameApproval,
    /* while the frame is up for approval the only remix on screen is the panel's own re-run */
    showRemixButton: !showEditedFrameApproval,
    showGiphyResults: ctx.giphyResults.length > 0,
    showGiphyPick: !!ctx.giphyPick,
    showGiphyRemixButton: !!ctx.prompt.trim() && !!ctx.giphyPick,
    showUrlApplyEdit: !!ctx.prompt.trim() && !!ctx.imageUrl && !ctx.edited,
    showBusy: isBusy,
    showErr: !!ctx.err,
    giphyStatusHidden: ctx.giphyResults.length > 0,
    showPreviewCard: !!ctx.imageUrl || !!ctx.videoUrl,
    showPreviewSkeleton: isBusy && !ctx.imageUrl && !ctx.videoUrl,
    showMintHint: !canMint && !isBusy,
    showSuccess: phase === 'success',
    formProps: { 'aria-busy': isBusy },
    getModeButtonProps: (candidate) => ({
      selected: ctx.mode === candidate,
      buttonProps: {
        type: 'button',
        'aria-pressed': ctx.mode === candidate,
        disabled: isBusy,
        onClick: () => actions.selectMode(candidate),
      },
    }),
    titleInputProps: {
      id: 'create-title',
      value: ctx.title,
      'aria-describedby': HELP_IDS.title,
      onChange: (event) => actions.setTitle(boundTitle(event.currentTarget.value)),
    },
    tagsInputProps: {
      value: ctx.tags,
      maxLength: 80,
      'aria-describedby': HELP_IDS.tags,
      onChange: (event) => actions.setTags(boundTags(event.currentTarget.value)),
    },
    remixOutputSelectProps: {
      value: ctx.remixOutput,
      onValueChange: (value) => {
        if (value && isRemixOutput(value)) actions.setRemixOutput(value)
      },
    },
    videoModeSelectProps: {
      value: ctx.videoMode,
      onValueChange: (value) => {
        if (value && isVideoRemixStyle(value)) actions.setVideoMode(value)
      },
    },
    remixPromptTextareaProps: {
      value: ctx.prompt,
      onChange: (event) => actions.setPrompt(event.currentTarget.value),
    },
    motionPromptTextareaProps: {
      value: ctx.motionPrompt,
      onChange: (event) => actions.setMotionPrompt(event.currentTarget.value),
    },
    animateEditedButtonProps: {
      type: 'button',
      disabled: isBusy,
      onClick: () => void actions.animateEdited(),
    },
    rerunEditButtonProps: {
      type: 'button',
      disabled: isBusy || !ctx.prompt.trim(),
      onClick: () => void actions.remix(),
    },
    remixButtonProps: {
      type: 'button',
      disabled: !ctx.prompt.trim() || !ctx.remixSource || isBusy,
      onClick: () => void actions.remix(),
    },
    giphyCategorySelectProps: {
      /* the picker never holds a value: a category runs a search and the row goes back to browsing */
      value: '',
      disabled: isBusy,
      onValueChange: (value) => {
        if (value) void actions.searchGiphy(value)
      },
    },
    giphyQueryInputProps: {
      type: 'search',
      value: ctx.giphyQuery,
      onChange: (event) => actions.setGiphyQuery(event.currentTarget.value),
      onKeyDown: (event) => {
        if (event.key !== 'Enter') return
        event.preventDefault()
        void actions.searchGiphy(ctx.giphyQuery)
      },
    },
    giphySearchButtonProps: {
      type: 'button',
      disabled: !ctx.giphyQuery.trim() || isBusy,
      onClick: () => void actions.searchGiphy(ctx.giphyQuery),
    },
    /* only the picked cell animates: fifty looping originals is a payload and a 2.2.2 failure */
    getGiphyResultProps: (result) => {
      const picked = ctx.giphyPick?.id === result.id
      return {
        picked,
        buttonProps: {
          type: 'button',
          'aria-pressed': picked,
          onClick: () => actions.pickGiphy(result),
        },
        imageProps: {
          src: picked ? result.gifUrl : result.stillUrl,
          alt: result.title,
          loading: 'lazy',
          decoding: 'async',
        },
      }
    },
    giphyPromptTextareaProps: {
      value: ctx.prompt,
      onChange: (event) => actions.setPrompt(event.currentTarget.value),
    },
    applyGiphyEditButtonProps: {
      type: 'button',
      disabled: isBusy,
      onClick: () => void actions.applyGiphyEdit(),
    },
    urlInputProps: {
      type: 'url',
      value: ctx.urlDraft,
      'aria-describedby': HELP_IDS.url,
      onChange: (event) => actions.setUrl(event.currentTarget.value),
      onBlur: () => void actions.resolvePageUrl(),
      onKeyDown: (event) => {
        if (event.key !== 'Enter') return
        event.preventDefault()
        void actions.resolvePageUrl()
      },
    },
    fetchUrlButtonProps: {
      type: 'button',
      disabled: !ctx.urlDraft.trim() || isBusy,
      onClick: () => void actions.resolvePageUrl(),
    },
    urlPromptTextareaProps: {
      value: ctx.prompt,
      onChange: (event) => actions.setPrompt(event.currentTarget.value),
    },
    applyUrlEditButtonProps: {
      type: 'button',
      disabled: isBusy,
      onClick: () => void actions.applyUrlEdit(),
    },
    imageFileInputProps: {
      type: 'file',
      accept: 'image/png,image/jpeg,image/gif,image/webp',
      'aria-describedby': HELP_IDS.uploadImage,
      onChange: (event) => {
        const file = firstFile(event)
        if (file) void actions.uploadImage(file)
      },
    },
    uploadImageLabel: 'Image',
    videoFileInputProps: {
      type: 'file',
      accept: 'video/mp4,video/quicktime,video/webm',
      'aria-describedby': HELP_IDS.uploadVideo,
      onChange: (event) => {
        const file = firstFile(event)
        if (file) void actions.uploadVideo(file)
      },
    },
    uploadVideoLabel: 'Video',
    generatePromptTextareaProps: {
      value: ctx.prompt,
      'aria-describedby': HELP_IDS.prompt,
      onChange: (event) => actions.setPrompt(event.currentTarget.value),
    },
    generateButtonProps: {
      type: 'button',
      disabled: !ctx.prompt.trim() || isBusy,
      onClick: () => void actions.generate(),
    },
    mintButtonProps: {
      type: 'button',
      disabled: !canMint,
      onClick: () => void actions.mint(),
    },
    busyNoticeProps: { role: 'status', 'aria-live': 'polite' },
    errorNoticeProps: { role: 'alert', 'aria-live': 'assertive' },
    /* one live region for the whole panel: intro, empty search, and "results arrived" */
    giphyStatusProps: { role: 'status' },
    previewCard: buildCard(ctx),
    successCard: buildCard(ctx),
    mintStatus:
      phase === 'success'
        ? ctx.shareCopied
          ? 'Share link copied to your clipboard.'
          : 'Minted. Your card is live and the share link is ready.'
        : '',
    successHeading: '🧠 Minted. It is live.',
    successBody:
      'All 100 shares are yours. Send the link — every reshare pushes the card up the tier ladder.',
    copyShareLinkLabel: ctx.shareCopied ? 'Copied ✓' : '🔗 Copy share link',
    copyShareLinkButtonProps: {
      type: 'button',
      onClick: () => void actions.copyShareLink(),
    },
    shareUrlInputProps: { value: ctx.shareUrl, readOnly: true, 'aria-label': 'Share link' },
    openMintedLinkProps: { to: `/m/${ctx.mintedId ?? ''}` },
  }
}

async function uploadFile(file: File | Blob, contentType?: string): Promise<string> {
  const type = contentType ?? (file as File).type
  const { uploadUrl, publicUrl } = await post<{ uploadUrl: string; publicUrl: string }>(
    '/api/uploads',
    { contentType: type, size: file.size },
  )
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': type },
    body: file,
  })
  if (!put.ok) throw new Error(`upload failed (${put.status})`)
  return publicUrl
}

function fetchVideoStatus(id: string): Promise<{
  status: string
  videoUrl?: string
  errorMessage?: string
}> {
  return apiFetch(`/api/aigen/video/${id}`)
}

export const PENDING_VIDEO_KEY = 'memeon_pending_video'
const POLL_TIMEOUT_MS = 8 * 60_000

interface CreationLifetime {
  active: boolean
}

interface VideoPollRun {
  owner: CreationLifetime
  interval: ReturnType<typeof setInterval> | null
  reject: (reason: Error) => void
  settled: boolean
}

class CreationLifetimeCancelledError extends Error {
  constructor() {
    super('creation lifetime ended')
    this.name = 'CreationLifetimeCancelledError'
  }
}

function assertActive(owner: CreationLifetime): void {
  if (!owner.active) throw new CreationLifetimeCancelledError()
}

function isLifetimeCancellation(error: unknown): boolean {
  return error instanceof CreationLifetimeCancelledError
}

export function pendingVideoMatchesRemix(
  pendingRemixId: string | null | undefined,
  remixId: string | null,
): boolean {
  return (pendingRemixId ?? null) === remixId
}

export interface PendingVideoRecord {
  generationId: string
  startedAt: number
  imageUrl: string
  remixId: string | null
  draft: CreateMemeDraft
}

/** The typed half of the resume record: a finished render is useless without the draft around it. */
export function draftOf(ctx: CreateMemeContext): CreateMemeDraft {
  return {
    mode: ctx.mode,
    title: ctx.title,
    tags: ctx.tags,
    prompt: ctx.prompt,
    motionPrompt: ctx.motionPrompt,
    remixOutput: ctx.remixOutput,
    videoUrl: ctx.videoUrl,
  }
}

export function pendingVideoRecord(
  ctx: CreateMemeContext,
  generationId: string,
  startedAt: number,
): PendingVideoRecord {
  return {
    generationId,
    startedAt,
    imageUrl: ctx.imageUrl,
    remixId: ctx.remixId,
    draft: draftOf(ctx),
  }
}

export function elapsedLabel(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, '0')}s`
}

function clearPendingVideoIfOwned(generationId: string, startedAt: number): void {
  const raw = sessionStorage.getItem(PENDING_VIDEO_KEY)
  if (!raw) return
  try {
    const pending = JSON.parse(raw) as { generationId?: unknown; startedAt?: unknown }
    if (pending.generationId === generationId && pending.startedAt === startedAt) {
      sessionStorage.removeItem(PENDING_VIDEO_KEY)
    }
  } catch {
    /* A malformed record is handled by the mount-time recovery path. */
  }
}

/** Everything `CreateMemeScreen` renders. The hook is the engine; the screen is the terminal. */
export function useCreateMemeScreen(): CreateMemeScreenModel {
  const [params] = useSearchParams()
  const remixId = params.get('remix')
  const [snapshot, send, actor] = useProjectedActor(createMemeMachine, {
    input: { remixId },
  })
  const lifetimeRef = useRef<CreationLifetime | null>(null)
  const pollRunRef = useRef<VideoPollRun | null>(null)
  const ctx = snapshot.context
  const phase = snapshot.value as CreateMemePhase
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopElapsed = useCallback(() => {
    if (tickerRef.current) clearInterval(tickerRef.current)
    tickerRef.current = null
  }, [])

  /** Every job that can run for minutes gets the same live counter, not just the video poller. */
  const beginBusy = useCallback(
    (busy: string, since = Date.now()) => {
      send({ type: 'SUBMIT', busy })
      stopElapsed()
      send({ type: 'TICK', elapsed: elapsedLabel(Date.now() - since) })
      tickerRef.current = setInterval(
        () => send({ type: 'TICK', elapsed: elapsedLabel(Date.now() - since) }),
        1000,
      )
    },
    [send, stopElapsed],
  )

  const settleBusy = useCallback(
    (event: CreateMemeEvent) => {
      stopElapsed()
      send(event)
    },
    [send, stopElapsed],
  )

  /** Keep the resume record in step with the form, but only while a render is actually pending. */
  const persistDraft = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      const raw = sessionStorage.getItem(PENDING_VIDEO_KEY)
      if (!raw) return
      try {
        const pending = JSON.parse(raw) as PendingVideoRecord
        sessionStorage.setItem(
          PENDING_VIDEO_KEY,
          JSON.stringify({ ...pending, draft: draftOf(actor.getSnapshot().context) }),
        )
      } catch {
        /* A malformed record is handled by the mount-time recovery path. */
      }
    }, 400)
  }, [actor])

  const cancelPollRun = useCallback((run: VideoPollRun) => {
    if (run.settled) return
    run.settled = true
    if (run.interval) clearInterval(run.interval)
    if (pollRunRef.current === run) pollRunRef.current = null
    run.reject(new CreationLifetimeCancelledError())
  }, [])

  const pollVideo = useCallback(
    (generationId: string, startedAt: number, owner: CreationLifetime): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        if (!owner.active) {
          reject(new CreationLifetimeCancelledError())
          return
        }
        if (pollRunRef.current) cancelPollRun(pollRunRef.current)
        const run: VideoPollRun = { owner, interval: null, reject, settled: false }
        pollRunRef.current = run
        const live = actor.getSnapshot().context
        sessionStorage.setItem(
          PENDING_VIDEO_KEY,
          JSON.stringify(pendingVideoRecord(live, generationId, startedAt)),
        )
        const finish = (fn: () => void) => {
          if (!owner.active || pollRunRef.current !== run) {
            cancelPollRun(run)
            return
          }
          run.settled = true
          if (run.interval) clearInterval(run.interval)
          pollRunRef.current = null
          clearPendingVideoIfOwned(generationId, startedAt)
          fn()
        }
        run.interval = setInterval(async () => {
          if (!owner.active || pollRunRef.current !== run) {
            cancelPollRun(run)
            return
          }
          if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
            return finish(() =>
              reject(
                new Error(
                  `Still rendering after 8 minutes. It may finish on Masky (job ${generationId}) — reopen this page to pick the render back up.`,
                ),
              ),
            )
          }
          try {
            const st = await fetchVideoStatus(generationId)
            if (!owner.active || pollRunRef.current !== run) {
              cancelPollRun(run)
              return
            }
            if (st.status === 'video' && st.videoUrl) {
              const url = st.videoUrl
              finish(() => resolve(url))
            } else if (st.status === 'error') {
              finish(() => reject(new Error(st.errorMessage ?? 'video generation failed')))
            }
          } catch (error) {
            if (!owner.active || pollRunRef.current !== run) {
              cancelPollRun(run)
              return
            }
            if (isLifetimeCancellation(error)) return
            /* transient poll failure — keep going until timeout */
          }
        }, 5000)
      }),
    [actor, cancelPollRun, send],
  )

  useMountEffect(() => {
    const owner: CreationLifetime = { active: true }
    lifetimeRef.current = owner
    if (remixId) {
      apiFetch<{ meme: Meme }>(`/api/memes/${remixId}`)
        .then((r) => {
          if (owner.active) send({ type: 'SET_REMIX_SOURCE', meme: r.meme })
        })
        .catch(() => {
          if (owner.active) send({ type: 'REMIX_SOURCE_MISSING' })
        })
    }

    const raw = sessionStorage.getItem(PENDING_VIDEO_KEY)
    if (raw) {
      try {
        const pending = JSON.parse(raw) as Partial<PendingVideoRecord> & {
          generationId: string
          startedAt: number
        }
        if (Date.now() - pending.startedAt > POLL_TIMEOUT_MS) {
          sessionStorage.removeItem(PENDING_VIDEO_KEY)
        } else if (pendingVideoMatchesRemix(pending.remixId, remixId)) {
          if (pending.imageUrl) send({ type: 'SET_IMAGE_URL', imageUrl: pending.imageUrl })
          /* the render survives a reload; so must the title, tags and prompt it belongs to */
          if (pending.draft) send({ type: 'RESTORE_DRAFT', draft: pending.draft })
          beginBusy('Resuming a video render already in progress…', pending.startedAt)
          void pollVideo(pending.generationId, pending.startedAt, owner)
            .then((url) => {
              assertActive(owner)
              send({ type: 'SET_VIDEO_URL', videoUrl: url })
              settleBusy({ type: 'DONE' })
            })
            .catch((e) => {
              if (!owner.active || isLifetimeCancellation(e)) return
              settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : 'render failed' })
            })
        }
      } catch {
        sessionStorage.removeItem(PENDING_VIDEO_KEY)
      }
    }

    return () => {
      owner.active = false
      if (lifetimeRef.current === owner) lifetimeRef.current = null
      stopElapsed()
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
      const pollRun = pollRunRef.current
      if (pollRun?.owner === owner) cancelPollRun(pollRun)
    }
  })

  const loadGiphyCategories = useCallback(() => {
    if (actor.getSnapshot().context.giphyCategories.length > 0) return
    apiFetch<{ categories: string[] }>('/api/giphy/categories')
      .then((r) => send({ type: 'SET_GIPHY_CATEGORIES', categories: r.categories }))
      .catch(() => {})
  }, [actor, send])

  const onSelectMode = useCallback(
    (mode: CreateMemeMode) => {
      send({ type: 'SELECT_MODE', mode })
      if (mode === 'giphy') loadGiphyCategories()
    },
    [loadGiphyCategories, send],
  )

  const onGiphySearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return
      send({ type: 'SET_GIPHY_QUERY', query: q })
      beginBusy('Searching Giphy…')
      try {
        const r = await apiFetch<{ results: GiphyResult[] }>(
          `/api/giphy/search?q=${encodeURIComponent(q)}`,
        )
        send({ type: 'SET_GIPHY_RESULTS', results: r.results })
        settleBusy({ type: 'DONE' })
      } catch (e) {
        settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : 'giphy search failed' })
      }
    },
    [beginBusy, send, settleBusy],
  )

  const onResolvePageUrl = useCallback(async () => {
    const url = actor.getSnapshot().context.urlDraft.trim()
    if (!url) return
    if (!/^https?:\/\//.test(url)) {
      send({ type: 'FAIL', err: 'that is not a link — paste a full https:// address' })
      return
    }
    /* a direct image link needs no resolver: promote it as-is */
    if (/\.(png|jpe?g|gif|webp)($|\?)/i.test(url)) {
      send({ type: 'SET_RESOLVED', imageUrl: url, videoUrl: null, source: null })
      return
    }
    beginBusy('Finding the main image on that page…')
    try {
      const out = await post<{
        imageUrl: string
        videoUrl: string | null
        source: {
          provider: string
          id: string
          url: string
          author: string | null
        } | null
      }>('/api/resolve-image', { url })
      send({
        type: 'SET_RESOLVED',
        imageUrl: out.imageUrl,
        videoUrl: out.videoUrl,
        source: out.source,
      })
      settleBusy({ type: 'DONE' })
    } catch (e) {
      settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : 'could not resolve that page' })
    }
  }, [actor, beginBusy, send, settleBusy])

  const applyEdit = useCallback(
    async (sourceUrl: string) => {
      beginBusy('Remixing with Masky (uses your credits)…')
      try {
        const out = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
          prompt: actor.getSnapshot().context.prompt,
          imageUrls: [sourceUrl],
        })
        send({ type: 'SET_IMAGE_URL', imageUrl: out.imageUrl, edited: true })
        settleBusy({ type: 'DONE' })
      } catch (e) {
        settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : 'edit failed' })
      }
    },
    [actor, beginBusy, send, settleBusy],
  )

  const onRemix = useCallback(async () => {
    const owner = lifetimeRef.current
    if (!owner?.active) return
    const live = actor.getSnapshot().context
    if (!live.remixSource) return
    const remixBusy =
      live.remixOutput === 'image'
        ? 'Remixing the art (uses your Masky credits)…'
        : live.videoMode === 'restyle' &&
            live.remixSource.mediaType === 'video' &&
            live.remixSource.videoUrl
          ? 'Restyling the whole video (uses your Masky credits)…'
          : 'Applying your edit to the frame (uses your Masky credits)…'
    beginBusy(remixBusy)
    try {
      if (live.remixOutput === 'image') {
        const out = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
          prompt: live.prompt,
          imageUrls: [live.remixSource.imageUrl],
        })
        assertActive(owner)
        send({ type: 'SET_IMAGE_URL', imageUrl: out.imageUrl })
        send({ type: 'SET_VIDEO_URL', videoUrl: '' })
      } else if (
        live.videoMode === 'restyle' &&
        live.remixSource.mediaType === 'video' &&
        live.remixSource.videoUrl
      ) {
        send({ type: 'BUSY', busy: 'Restyling the whole video (uses your Masky credits)…' })
        send({ type: 'SET_IMAGE_URL', imageUrl: live.remixSource.imageUrl })
        const started = await post<{ generationId: string }>('/api/aigen/video', {
          prompt: live.prompt,
          srcVideo: live.remixSource.videoUrl,
        })
        assertActive(owner)
        send({ type: 'BUSY', busy: 'Rendering video remix… hold the vibe.' })
        const videoUrl = await pollVideo(started.generationId, Date.now(), owner)
        assertActive(owner)
        send({ type: 'SET_VIDEO_URL', videoUrl })
      } else {
        send({ type: 'BUSY', busy: 'Applying your edit to the frame (uses your Masky credits)…' })
        const edited = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
          prompt: `${live.prompt}, keep everything else identical`,
          imageUrls: [live.remixSource.imageUrl],
        })
        assertActive(owner)
        send({ type: 'SET_EDITED_FRAME', imageUrl: edited.imageUrl })
      }
      assertActive(owner)
      settleBusy({ type: 'DONE' })
    } catch (e) {
      if (!owner.active || isLifetimeCancellation(e)) return
      settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : 'remix failed' })
    }
  }, [actor, beginBusy, pollVideo, send, settleBusy])

  const onGenerate = useCallback(async () => {
    const owner = lifetimeRef.current
    if (!owner?.active) return
    const live = actor.getSnapshot().context
    if (live.mode === 'video') {
      beginBusy('Starting video render (usually 1–3 minutes, uses your Masky credits)…')
      try {
        const thumb = await post<{ imageUrl: string }>('/api/aigen/image', {
          prompt: `${live.prompt} — single dramatic still frame, meme thumbnail`,
          aspectRatio: '1:1',
        })
        assertActive(owner)
        send({ type: 'SET_IMAGE_URL', imageUrl: thumb.imageUrl })
        const started = await post<{ generationId: string }>('/api/aigen/video', { prompt: live.prompt })
        assertActive(owner)
        send({ type: 'BUSY', busy: 'Rendering the video — hold the vibe.' })
        const videoUrl = await pollVideo(started.generationId, Date.now(), owner)
        assertActive(owner)
        send({ type: 'SET_VIDEO_URL', videoUrl })
        settleBusy({ type: 'DONE' })
      } catch (e) {
        if (!owner.active || isLifetimeCancellation(e)) return
        settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : 'video generation failed' })
      }
      return
    }
    beginBusy('Rendering your masterpiece (uses your Masky credits)…')
    try {
      const out = await post<{ imageUrl: string }>('/api/aigen/image', {
        prompt: live.prompt,
        aspectRatio: '1:1',
      })
      assertActive(owner)
      send({ type: 'SET_IMAGE_URL', imageUrl: out.imageUrl })
      settleBusy({ type: 'DONE' })
    } catch (e) {
      if (!owner.active || isLifetimeCancellation(e)) return
      settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : 'generation failed' })
    }
  }, [actor, beginBusy, pollVideo, send, settleBusy])

  const onAnimateEdited = useCallback(async () => {
    const owner = lifetimeRef.current
    if (!owner?.active) return
    const live = actor.getSnapshot().context
    if (!live.editedFrame) return
    beginBusy('Animating the approved frame (uses your Masky credits)…')
    try {
      const isVideoSource = live.remixSource?.mediaType === 'video' && live.remixSource.videoUrl
      const started = await post<{ generationId: string }>('/api/aigen/video', {
        prompt: isVideoSource
          ? `same video and motion as the source, with the change from the reference image applied${live.motionPrompt.trim() ? ` — ${live.motionPrompt.trim()}` : ''}`
          : live.motionPrompt.trim() || 'subtle natural motion true to the scene, same style, short loop',
        image: live.editedFrame,
        ...(isVideoSource ? { srcVideo: live.remixSource!.videoUrl } : {}),
      })
      assertActive(owner)
      const videoUrl = await pollVideo(started.generationId, Date.now(), owner)
      assertActive(owner)
      send({ type: 'SET_VIDEO_URL', videoUrl })
      send({ type: 'CLEAR_EDITED_FRAME' })
      settleBusy({ type: 'DONE' })
    } catch (e) {
      if (!owner.active || isLifetimeCancellation(e)) return
      settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : 'animation failed' })
    }
  }, [actor, beginBusy, pollVideo, send, settleBusy])

  const onMint = useCallback(async () => {
    const live = actor.getSnapshot().context
    beginBusy('Minting…')
    try {
      const isVideo =
        live.mode === 'video' ||
        ((live.mode === 'upload' || live.mode === 'remix' || live.mode === 'url') && !!live.videoUrl)
      const body = {
        title: live.title,
        imageUrl: live.imageUrl,
        mediaType: isVideo ? 'video' : 'image',
        videoUrl: isVideo ? live.videoUrl : null,
        remixOf: live.mode === 'remix' ? live.remixId : null,
        /* attribution rides on the artwork, not on whichever chip is lit when Mint is pressed */
        source: live.artworkSource,
        tags: live.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }
      const out = await post<{ meme: Meme }>('/api/memes', body)
      settleBusy({
        type: 'MINTED',
        id: out.meme.id,
        shareUrl: `${window.location.origin}/m/${out.meme.id}`,
      })
    } catch (e) {
      settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : 'mint failed' })
    }
  }, [actor, beginBusy, settleBusy])

  const onCopyShareLink = useCallback(async () => {
    const { shareUrl } = actor.getSnapshot().context
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    send({ type: 'SHARE_COPIED' })
  }, [actor, send])

  const onImageFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_IMAGE_BYTES) {
        send({ type: 'FAIL', err: overCapMessage('image', file.size, MAX_IMAGE_BYTES) })
        return
      }
      beginBusy('Uploading image…')
      try {
        send({ type: 'SET_IMAGE_URL', imageUrl: await uploadFile(file) })
        settleBusy({ type: 'DONE' })
      } catch (er) {
        settleBusy({ type: 'FAIL', err: er instanceof Error ? er.message : 'upload failed' })
      }
    },
    [beginBusy, send, settleBusy],
  )

  const onVideoFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_VIDEO_BYTES) {
        send({ type: 'FAIL', err: overCapMessage('video', file.size, MAX_VIDEO_BYTES) })
        return
      }
      beginBusy('Uploading video…')
      try {
        send({ type: 'SET_VIDEO_URL', videoUrl: await uploadFile(file) })
        if (!actor.getSnapshot().context.imageUrl) {
          send({ type: 'BUSY', busy: 'Grabbing the first frame for the card…' })
          const poster = await extractPoster(file)
          send({ type: 'SET_IMAGE_URL', imageUrl: await uploadFile(poster, 'image/png') })
        }
        settleBusy({ type: 'DONE' })
      } catch (er) {
        settleBusy({ type: 'FAIL', err: er instanceof Error ? er.message : 'upload failed' })
      }
    },
    [actor, beginBusy, send, settleBusy],
  )

  return buildCreateMemeScreenModel(phase, ctx, {
    selectMode: onSelectMode,
    setTitle: (title) => {
      send({ type: 'SET_TITLE', title })
      persistDraft()
    },
    setTags: (tags) => {
      send({ type: 'SET_TAGS', tags })
      persistDraft()
    },
    setPrompt: (prompt) => {
      send({ type: 'SET_PROMPT', prompt })
      persistDraft()
    },
    setRemixOutput: (remixOutput) => send({ type: 'SET_REMIX_OUTPUT', remixOutput }),
    setVideoMode: (videoMode) => send({ type: 'SET_VIDEO_MODE', videoMode }),
    setMotionPrompt: (motionPrompt) => {
      send({ type: 'SET_MOTION_PROMPT', motionPrompt })
      persistDraft()
    },
    setGiphyQuery: (query) => send({ type: 'SET_GIPHY_QUERY', query }),
    searchGiphy: onGiphySearch,
    pickGiphy: (pick) => send({ type: 'PICK_GIPHY', pick }),
    setUrl: (urlDraft) => send({ type: 'SET_URL_DRAFT', urlDraft }),
    resolvePageUrl: onResolvePageUrl,
    applyGiphyEdit: () => {
      const pick = actor.getSnapshot().context.giphyPick
      if (pick) return applyEdit(pick.stillUrl)
    },
    applyUrlEdit: () => {
      const url = actor.getSnapshot().context.imageUrl
      if (url) return applyEdit(url)
    },
    uploadImage: onImageFile,
    uploadVideo: onVideoFile,
    remix: onRemix,
    animateEdited: onAnimateEdited,
    generate: onGenerate,
    mint: onMint,
    copyShareLink: onCopyShareLink,
  })
}
