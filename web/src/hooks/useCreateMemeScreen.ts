import { useProjectedActor } from './useProjectedActor'
import { useCallback, useRef } from 'react'
import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  HTMLAttributes,
  ImgHTMLAttributes,
  InputHTMLAttributes,
  KeyboardEvent,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  VideoHTMLAttributes,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { extractPoster } from '../lib/extractPoster'
import type { GiphyResult, Meme } from '../lib/types'
import {
  createMemeMachine,
  type CreateMemeContext,
  type CreateMemeMode,
  type CreateMemePhase,
  type RemixOutput,
  type VideoRemixStyle,
} from '../stores/createMemeMachine'
import { useMountEffect } from './useMountEffect'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>
type InputProps = InputHTMLAttributes<HTMLInputElement>
type SelectProps = SelectHTMLAttributes<HTMLSelectElement>
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

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

export interface CreateMemeScreenModel {
  phase: CreateMemePhase
  mode: CreateMemeMode
  showRemixModeButton: boolean
  busy: string | null
  err: string | null
  remixSource: CreateMemeSourceModel | null
  giphyCategories: string[]
  giphyResults: GiphyResult[]
  giphyPick: SelectedGiphyModel | null
  remixPromptLabel: string
  remixPromptPlaceholder: string
  generatePromptPlaceholder: string
  remixButtonLabel: string
  generateButtonLabel: string
  mintHint: string
  showRemixPanel: boolean
  showGiphyPanel: boolean
  showUrlPanel: boolean
  showUploadPanel: boolean
  showGeneratePanel: boolean
  showVideoRemixStyle: boolean
  showEditedFrameApproval: boolean
  showGiphyResults: boolean
  showGiphyPick: boolean
  showGiphyRemixButton: boolean
  showUrlApplyEdit: boolean
  showBusy: boolean
  showErr: boolean
  showImagePreview: boolean
  showVideoPreview: boolean
  showMintHint: boolean
  formProps: HTMLAttributes<HTMLDivElement>
  getModeButtonProps: (mode: CreateMemeMode) => ButtonProps
  titleInputProps: InputProps
  tagsInputProps: InputProps
  remixOutputSelectProps: SelectProps
  videoModeSelectProps: SelectProps
  remixPromptTextareaProps: TextareaProps
  motionPromptTextareaProps: TextareaProps
  animateEditedButtonProps: ButtonProps
  rerunEditButtonProps: ButtonProps
  remixButtonProps: ButtonProps
  giphyCategorySelectProps: SelectProps
  giphyQueryInputProps: InputProps
  giphySearchButtonProps: ButtonProps
  getGiphyResultProps: (result: GiphyResult) => ImgHTMLAttributes<HTMLImageElement>
  giphyPromptTextareaProps: TextareaProps
  applyGiphyEditButtonProps: ButtonProps
  urlInputProps: InputProps
  urlPromptTextareaProps: TextareaProps
  applyUrlEditButtonProps: ButtonProps
  imageFileInputProps: InputProps
  videoFileInputProps: InputProps
  generatePromptTextareaProps: TextareaProps
  generateButtonProps: ButtonProps
  mintButtonProps: ButtonProps
  busyNoticeProps: HTMLAttributes<HTMLParagraphElement>
  errorNoticeProps: HTMLAttributes<HTMLParagraphElement>
  imagePreviewProps: ImgHTMLAttributes<HTMLImageElement>
  videoPreviewProps: VideoHTMLAttributes<HTMLVideoElement>
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

function isActivationKey(event: KeyboardEvent<HTMLElement>): boolean {
  return event.key === 'Enter' || event.key === ' '
}

/** Builds the terminal contract from machine state and domain actions. */
export function buildCreateMemeScreenModel(
  phase: CreateMemePhase,
  ctx: CreateMemeContext,
  actions: CreateMemeScreenActions,
): CreateMemeScreenModel {
  const isBusy = !!ctx.busy
  const remixPromptIsPrecise = ctx.remixOutput === 'video' && ctx.videoMode === 'edit'
  const canMint =
    !!ctx.title.trim() && !!ctx.imageUrl && (ctx.mode !== 'video' || !!ctx.videoUrl) && !isBusy
  const mintHint =
    [
      !ctx.title.trim() && 'add a title',
      !ctx.imageUrl && 'add artwork',
      ctx.mode === 'video' && !ctx.videoUrl && 'finish the video',
    ]
      .filter(Boolean)
      .join(' · ') || '…'

  return {
    phase,
    mode: ctx.mode,
    showRemixModeButton: !!ctx.remixId,
    busy: ctx.busy,
    err: ctx.err,
    remixSource: ctx.remixSource
      ? {
          imageProps: { src: ctx.remixSource.imageUrl, alt: ctx.remixSource.title },
          linkProps: { to: `/m/${ctx.remixSource.id}` },
          title: ctx.remixSource.title,
          creatorName: ctx.remixSource.creatorName,
        }
      : null,
    giphyCategories: ctx.giphyCategories,
    giphyResults: ctx.giphyResults,
    giphyPick: ctx.giphyPick
      ? {
          title: ctx.giphyPick.title,
          authorLabel: ctx.giphyPick.author ? ` (@${ctx.giphyPick.author})` : null,
        }
      : null,
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
    remixButtonLabel: ctx.remixOutput === 'video' ? 'Remix into video' : 'Remix image',
    generateButtonLabel: ctx.mode === 'video' ? 'Generate video' : 'Generate image',
    mintHint,
    showRemixPanel: ctx.mode === 'remix',
    showGiphyPanel: ctx.mode === 'giphy',
    showUrlPanel: ctx.mode === 'url',
    showUploadPanel: ctx.mode === 'upload',
    showGeneratePanel: ctx.mode === 'generate' || ctx.mode === 'video',
    showVideoRemixStyle: ctx.remixOutput === 'video' && ctx.remixSource?.mediaType === 'video',
    showEditedFrameApproval:
      ctx.remixOutput === 'video' && ctx.videoMode === 'edit' && !!ctx.editedFrame && !ctx.videoUrl,
    showGiphyResults: ctx.giphyResults.length > 0,
    showGiphyPick: !!ctx.giphyPick,
    showGiphyRemixButton: !!ctx.prompt.trim() && !!ctx.giphyPick,
    showUrlApplyEdit: !!ctx.prompt.trim() && !!ctx.imageUrl && !ctx.edited,
    showBusy: isBusy,
    showErr: !!ctx.err,
    showImagePreview: !!ctx.imageUrl,
    showVideoPreview: !!ctx.videoUrl,
    showMintHint: !canMint && !isBusy,
    formProps: { 'aria-busy': isBusy },
    getModeButtonProps: (candidate) => ({
      type: 'button',
      className: ctx.mode === candidate ? 'primary' : '',
      'aria-pressed': ctx.mode === candidate,
      onClick: () => actions.selectMode(candidate),
    }),
    titleInputProps: {
      value: ctx.title,
      maxLength: 20,
      onChange: (event) => actions.setTitle(event.currentTarget.value.slice(0, 20)),
    },
    tagsInputProps: {
      value: ctx.tags,
      onChange: (event) => actions.setTags(event.currentTarget.value),
    },
    remixOutputSelectProps: {
      value: ctx.remixOutput,
      onChange: (event) => {
        if (isRemixOutput(event.currentTarget.value)) {
          actions.setRemixOutput(event.currentTarget.value)
        }
      },
    },
    videoModeSelectProps: {
      value: ctx.videoMode,
      onChange: (event) => {
        if (isVideoRemixStyle(event.currentTarget.value)) {
          actions.setVideoMode(event.currentTarget.value)
        }
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
      value: '',
      'aria-label': 'Browse Giphy categories',
      onChange: (event) => {
        if (event.currentTarget.value) void actions.searchGiphy(event.currentTarget.value)
      },
    },
    giphyQueryInputProps: {
      type: 'search',
      value: ctx.giphyQuery,
      'aria-label': 'Search Giphy',
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
    getGiphyResultProps: (result) => ({
      src: result.gifUrl,
      alt: result.title,
      title: result.title,
      role: 'button',
      tabIndex: 0,
      className: ctx.giphyPick?.id === result.id ? 'giphy-cell picked' : 'giphy-cell',
      'aria-pressed': ctx.giphyPick?.id === result.id,
      onClick: () => actions.pickGiphy(result),
      onKeyDown: (event) => {
        if (!isActivationKey(event)) return
        event.preventDefault()
        actions.pickGiphy(result)
      },
    }),
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
      value: ctx.imageUrl,
      onChange: (event) => actions.setUrl(event.currentTarget.value),
      onBlur: () => void actions.resolvePageUrl(),
      onKeyDown: (event) => {
        if (event.key !== 'Enter') return
        event.preventDefault()
        void actions.resolvePageUrl()
      },
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
      onChange: (event) => {
        const file = firstFile(event)
        if (file) void actions.uploadImage(file)
      },
    },
    videoFileInputProps: {
      type: 'file',
      accept: 'video/mp4,video/quicktime,video/webm',
      onChange: (event) => {
        const file = firstFile(event)
        if (file) void actions.uploadVideo(file)
      },
    },
    generatePromptTextareaProps: {
      value: ctx.prompt,
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
    imagePreviewProps: { src: ctx.imageUrl, alt: 'preview' },
    videoPreviewProps: { src: ctx.videoUrl, controls: true, 'aria-label': 'Video preview' },
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

export function pendingVideoMatchesRemix(
  pendingRemixId: string | null | undefined,
  remixId: string | null,
): boolean {
  return (pendingRemixId ?? null) === remixId
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
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const remixId = params.get('remix')
  const [snapshot, send, actor] = useProjectedActor(createMemeMachine, {
    input: { remixId },
  })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRunRef = useRef(0)
  const ctx = snapshot.context
  const phase = snapshot.value as CreateMemePhase

  const pollVideo = useCallback(
    (generationId: string, startedAt: number): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
        const run = pollRunRef.current + 1
        pollRunRef.current = run
        const live = actor.getSnapshot().context
        sessionStorage.setItem(
          PENDING_VIDEO_KEY,
          JSON.stringify({
            generationId,
            startedAt,
            imageUrl: live.imageUrl,
            remixId: live.remixId,
          }),
        )
        let interval: ReturnType<typeof setInterval> | null = null
        const finish = (fn: () => void) => {
          if (interval) clearInterval(interval)
          if (pollRef.current === interval) pollRef.current = null
          if (pollRunRef.current === run) clearPendingVideoIfOwned(generationId, startedAt)
          fn()
        }
        interval = setInterval(async () => {
          const elapsed = Math.round((Date.now() - startedAt) / 1000)
          send({
            type: 'BUSY',
            busy: `Rendering video… ${Math.floor(elapsed / 60)}m${String(elapsed % 60).padStart(2, '0')}s — hold the vibe.`,
          })
          if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
            return finish(() =>
              reject(
                new Error(
                  `render is taking longer than 8 minutes — it may still finish on Masky (job ${generationId}); come back to this page to resume waiting`,
                ),
              ),
            )
          }
          try {
            const st = await fetchVideoStatus(generationId)
            if (st.status === 'video' && st.videoUrl) {
              const url = st.videoUrl
              finish(() => resolve(url))
            } else if (st.status === 'error') {
              finish(() => reject(new Error(st.errorMessage ?? 'video generation failed')))
            }
          } catch {
            /* transient poll failure — keep going until timeout */
          }
        }, 5000)
        pollRef.current = interval
      }),
    [actor, send],
  )

  useMountEffect(() => {
    if (remixId) {
      apiFetch<{ meme: Meme }>(`/api/memes/${remixId}`)
        .then((r) => send({ type: 'SET_REMIX_SOURCE', meme: r.meme }))
        .catch(() => send({ type: 'REMIX_SOURCE_MISSING' }))
    }

    const raw = sessionStorage.getItem(PENDING_VIDEO_KEY)
    if (raw) {
      try {
        const pending = JSON.parse(raw) as {
          generationId: string
          startedAt: number
          imageUrl?: string
          remixId?: string | null
        }
        if (Date.now() - pending.startedAt > POLL_TIMEOUT_MS) {
          sessionStorage.removeItem(PENDING_VIDEO_KEY)
        } else if (pendingVideoMatchesRemix(pending.remixId, remixId)) {
          if (pending.imageUrl) send({ type: 'SET_IMAGE_URL', imageUrl: pending.imageUrl })
          send({ type: 'SUBMIT', busy: 'Resuming a video render already in progress…' })
          void pollVideo(pending.generationId, pending.startedAt)
            .then((url) => {
              send({ type: 'SET_VIDEO_URL', videoUrl: url })
              send({ type: 'DONE' })
            })
            .catch((e) => send({ type: 'FAIL', err: e instanceof Error ? e.message : 'render failed' }))
        }
      } catch {
        sessionStorage.removeItem(PENDING_VIDEO_KEY)
      }
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
      pollRunRef.current += 1
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
      send({ type: 'SUBMIT', busy: 'Searching Giphy…' })
      try {
        const r = await apiFetch<{ results: GiphyResult[] }>(
          `/api/giphy/search?q=${encodeURIComponent(q)}`,
        )
        send({
          type: 'SET_GIPHY_RESULTS',
          results: r.results,
          emptyMessage: r.results.length === 0 ? `Giphy came up empty for "${q}"` : null,
        })
        send({ type: 'DONE' })
      } catch (e) {
        send({ type: 'FAIL', err: e instanceof Error ? e.message : 'giphy search failed' })
      }
    },
    [send],
  )

  const onResolvePageUrl = useCallback(async () => {
    const url = actor.getSnapshot().context.imageUrl.trim()
    if (!url || !/^https?:\/\//.test(url) || /\.(png|jpe?g|gif|webp)($|\?)/i.test(url)) return
    send({ type: 'SUBMIT', busy: 'Finding the main image on that page…' })
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
      send({ type: 'DONE' })
    } catch (e) {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : 'could not resolve that page' })
    }
  }, [actor, send])

  const applyEdit = useCallback(
    async (sourceUrl: string) => {
      send({ type: 'SUBMIT', busy: 'Remixing with Masky (uses your credits)…' })
      try {
        const out = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
          prompt: actor.getSnapshot().context.prompt,
          imageUrls: [sourceUrl],
        })
        send({ type: 'SET_IMAGE_URL', imageUrl: out.imageUrl, edited: true })
        send({ type: 'DONE' })
      } catch (e) {
        send({ type: 'FAIL', err: e instanceof Error ? e.message : 'edit failed' })
      }
    },
    [actor, send],
  )

  const onRemix = useCallback(async () => {
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
    send({ type: 'SUBMIT', busy: remixBusy })
    try {
      if (live.remixOutput === 'image') {
        const out = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
          prompt: live.prompt,
          imageUrls: [live.remixSource.imageUrl],
        })
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
        send({ type: 'BUSY', busy: 'Rendering video remix… hold the vibe.' })
        send({ type: 'SET_VIDEO_URL', videoUrl: await pollVideo(started.generationId, Date.now()) })
      } else {
        send({ type: 'BUSY', busy: 'Applying your edit to the frame (uses your Masky credits)…' })
        const edited = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
          prompt: `${live.prompt}, keep everything else identical`,
          imageUrls: [live.remixSource.imageUrl],
        })
        send({ type: 'SET_EDITED_FRAME', imageUrl: edited.imageUrl })
      }
      send({ type: 'DONE' })
    } catch (e) {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : 'remix failed' })
    }
  }, [actor, pollVideo, send])

  const onGenerate = useCallback(async () => {
    const live = actor.getSnapshot().context
    if (live.mode === 'video') {
      send({ type: 'SUBMIT', busy: 'Starting video render (1–3 min, uses your Masky credits)…' })
      try {
        const thumb = await post<{ imageUrl: string }>('/api/aigen/image', {
          prompt: `${live.prompt} — single dramatic still frame, meme thumbnail`,
          aspectRatio: '1:1',
        })
        send({ type: 'SET_IMAGE_URL', imageUrl: thumb.imageUrl })
        const started = await post<{ generationId: string }>('/api/aigen/video', { prompt: live.prompt })
        send({ type: 'BUSY', busy: 'Rendering video… this takes a minute or three. Hold the vibe.' })
        send({ type: 'SET_VIDEO_URL', videoUrl: await pollVideo(started.generationId, Date.now()) })
        send({ type: 'DONE' })
      } catch (e) {
        send({ type: 'FAIL', err: e instanceof Error ? e.message : 'video generation failed' })
      }
      return
    }
    send({ type: 'SUBMIT', busy: 'Rendering your masterpiece (uses your Masky credits)…' })
    try {
      const out = await post<{ imageUrl: string }>('/api/aigen/image', {
        prompt: live.prompt,
        aspectRatio: '1:1',
      })
      send({ type: 'SET_IMAGE_URL', imageUrl: out.imageUrl })
      send({ type: 'DONE' })
    } catch (e) {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : 'generation failed' })
    }
  }, [actor, pollVideo, send])

  const onAnimateEdited = useCallback(async () => {
    const live = actor.getSnapshot().context
    if (!live.editedFrame) return
    send({ type: 'SUBMIT', busy: 'Animating the approved frame (uses your Masky credits)…' })
    try {
      const isVideoSource = live.remixSource?.mediaType === 'video' && live.remixSource.videoUrl
      const started = await post<{ generationId: string }>('/api/aigen/video', {
        prompt: isVideoSource
          ? `same video and motion as the source, with the change from the reference image applied${live.motionPrompt.trim() ? ` — ${live.motionPrompt.trim()}` : ''}`
          : live.motionPrompt.trim() || 'subtle natural motion true to the scene, same style, short loop',
        image: live.editedFrame,
        ...(isVideoSource ? { srcVideo: live.remixSource!.videoUrl } : {}),
      })
      send({ type: 'SET_VIDEO_URL', videoUrl: await pollVideo(started.generationId, Date.now()) })
      send({ type: 'CLEAR_EDITED_FRAME' })
      send({ type: 'DONE' })
    } catch (e) {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : 'animation failed' })
    }
  }, [actor, pollVideo, send])

  const onMint = useCallback(async () => {
    const live = actor.getSnapshot().context
    send({ type: 'SUBMIT', busy: 'Minting…' })
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
        source:
          live.mode === 'giphy' && live.giphyPick && !live.edited
            ? {
                provider: 'giphy',
                id: live.giphyPick.id,
                url: live.giphyPick.url,
                author: live.giphyPick.author,
              }
            : live.mode === 'url' && live.resolvedSource && !live.edited
              ? live.resolvedSource
              : null,
        tags: live.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }
      const out = await post<{ meme: Meme }>('/api/memes', body)
      send({ type: 'MINTED', id: out.meme.id })
      navigate(`/m/${out.meme.id}`)
    } catch (e) {
      send({ type: 'FAIL', err: e instanceof Error ? e.message : 'mint failed' })
    }
  }, [actor, navigate, send])

  const onImageFile = useCallback(
    async (file: File) => {
      send({ type: 'SUBMIT', busy: 'Uploading image…' })
      try {
        send({ type: 'SET_IMAGE_URL', imageUrl: await uploadFile(file) })
        send({ type: 'DONE' })
      } catch (er) {
        send({ type: 'FAIL', err: er instanceof Error ? er.message : 'upload failed' })
      }
    },
    [send],
  )

  const onVideoFile = useCallback(
    async (file: File) => {
      send({ type: 'SUBMIT', busy: 'Uploading video…' })
      try {
        send({ type: 'SET_VIDEO_URL', videoUrl: await uploadFile(file) })
        if (!actor.getSnapshot().context.imageUrl) {
          send({ type: 'BUSY', busy: 'Grabbing the first frame for the card…' })
          const poster = await extractPoster(file)
          send({ type: 'SET_IMAGE_URL', imageUrl: await uploadFile(poster, 'image/png') })
        }
        send({ type: 'DONE' })
      } catch (er) {
        send({ type: 'FAIL', err: er instanceof Error ? er.message : 'upload failed' })
      }
    },
    [actor, send],
  )

  return buildCreateMemeScreenModel(phase, ctx, {
    selectMode: onSelectMode,
    setTitle: (title) => send({ type: 'SET_TITLE', title }),
    setTags: (tags) => send({ type: 'SET_TAGS', tags }),
    setPrompt: (prompt) => send({ type: 'SET_PROMPT', prompt }),
    setRemixOutput: (remixOutput) => send({ type: 'SET_REMIX_OUTPUT', remixOutput }),
    setVideoMode: (videoMode) => send({ type: 'SET_VIDEO_MODE', videoMode }),
    setMotionPrompt: (motionPrompt) => send({ type: 'SET_MOTION_PROMPT', motionPrompt }),
    setGiphyQuery: (query) => send({ type: 'SET_GIPHY_QUERY', query }),
    searchGiphy: onGiphySearch,
    pickGiphy: (pick) => send({ type: 'PICK_GIPHY', pick }),
    setUrl: (imageUrl) => send({ type: 'SET_IMAGE_URL', imageUrl, edited: false }),
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
  })
}
