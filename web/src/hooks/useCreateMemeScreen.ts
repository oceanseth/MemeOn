import { useMachine } from '@xstate/react'
import { useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch, post } from '../lib/api'
import { extractPoster } from '../lib/extractPoster'
import type { GiphyResult, Meme } from '../lib/types'
import {
  createMemeMachine,
  type CreateMemeMode,
  type CreateMemePhase,
  type RemixOutput,
  type VideoRemixStyle,
} from '../stores/createMemeMachine'
import { useMountEffect } from './useMountEffect'

export interface CreateMemeScreenModel {
  phase: CreateMemePhase
  mode: CreateMemeMode
  showRemixModeButton: boolean
  title: string
  tags: string
  prompt: string
  imageUrl: string
  videoUrl: string
  busy: string | null
  err: string | null
  remixSource: Meme | null
  remixOutput: RemixOutput
  videoMode: VideoRemixStyle
  motionPrompt: string
  editedFrame: string | null
  giphyCategories: string[]
  giphyQuery: string
  giphyResults: GiphyResult[]
  giphyPick: GiphyResult | null
  remixPromptLabel: string
  remixPromptPlaceholder: string
  generatePromptPlaceholder: string
  remixButtonLabel: string
  generateButtonLabel: string
  mintHint: string
  canMint: boolean
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
  onSelectMode: (mode: CreateMemeMode) => void
  onTitleChange: (title: string) => void
  onTagsChange: (tags: string) => void
  onPromptChange: (prompt: string) => void
  onRemixOutputChange: (value: RemixOutput) => void
  onVideoModeChange: (value: VideoRemixStyle) => void
  onMotionPromptChange: (value: string) => void
  onGiphyQueryChange: (query: string) => void
  onGiphySearch: (query: string) => void
  onPickGiphy: (g: GiphyResult) => void
  onUrlChange: (url: string) => void
  onResolvePageUrl: () => void
  onApplyGiphyEdit: () => void
  onApplyUrlEdit: () => void
  onImageFile: (file: File) => void
  onVideoFile: (file: File) => void
  onRemix: () => void
  onAnimateEdited: () => void
  onGenerate: () => void
  onMint: () => void
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

const PENDING_KEY = 'memeon_pending_video'
const POLL_TIMEOUT_MS = 8 * 60_000

/** Everything `CreateMemeScreen` renders. The hook is the engine; the screen is the terminal. */
export function useCreateMemeScreen(): CreateMemeScreenModel {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const remixId = params.get('remix')
  const [snapshot, send, actor] = useMachine(createMemeMachine, {
    input: { remixId },
  })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ctx = snapshot.context
  const phase = snapshot.value as CreateMemePhase

  const pollVideo = useCallback(
    (generationId: string, startedAt: number): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        const live = actor.getSnapshot().context
        sessionStorage.setItem(
          PENDING_KEY,
          JSON.stringify({
            generationId,
            startedAt,
            imageUrl: live.imageUrl,
            remixId: live.remixId,
          }),
        )
        const finish = (fn: () => void) => {
          if (pollRef.current) clearInterval(pollRef.current)
          sessionStorage.removeItem(PENDING_KEY)
          fn()
        }
        pollRef.current = setInterval(async () => {
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
      }),
    [actor, send],
  )

  useMountEffect(() => {
    if (remixId) {
      apiFetch<{ meme: Meme }>(`/api/memes/${remixId}`)
        .then((r) => send({ type: 'SET_REMIX_SOURCE', meme: r.meme }))
        .catch(() => send({ type: 'REMIX_SOURCE_MISSING' }))
    }

    const raw = sessionStorage.getItem(PENDING_KEY)
    if (raw) {
      try {
        const pending = JSON.parse(raw) as {
          generationId: string
          startedAt: number
          imageUrl?: string
        }
        if (Date.now() - pending.startedAt > POLL_TIMEOUT_MS) {
          sessionStorage.removeItem(PENDING_KEY)
        } else {
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
        sessionStorage.removeItem(PENDING_KEY)
      }
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
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

  const remixPromptIsPrecise = ctx.remixOutput === 'video' && ctx.videoMode === 'edit'
  const canMint =
    !!ctx.title.trim() && !!ctx.imageUrl && (ctx.mode !== 'video' || !!ctx.videoUrl) && !ctx.busy
  const mintHint = [
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
    title: ctx.title,
    tags: ctx.tags,
    prompt: ctx.prompt,
    imageUrl: ctx.imageUrl,
    videoUrl: ctx.videoUrl,
    busy: ctx.busy,
    err: ctx.err,
    remixSource: ctx.remixSource,
    remixOutput: ctx.remixOutput,
    videoMode: ctx.videoMode,
    motionPrompt: ctx.motionPrompt,
    editedFrame: ctx.editedFrame,
    giphyCategories: ctx.giphyCategories,
    giphyQuery: ctx.giphyQuery,
    giphyResults: ctx.giphyResults,
    giphyPick: ctx.giphyPick,
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
    canMint,
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
    showBusy: !!ctx.busy,
    showErr: !!ctx.err,
    showImagePreview: !!ctx.imageUrl,
    showVideoPreview: !!ctx.videoUrl,
    showMintHint: !canMint && !ctx.busy,
    onSelectMode,
    onTitleChange: (title) => send({ type: 'SET_TITLE', title }),
    onTagsChange: (tags) => send({ type: 'SET_TAGS', tags }),
    onPromptChange: (prompt) => send({ type: 'SET_PROMPT', prompt }),
    onRemixOutputChange: (value) => send({ type: 'SET_REMIX_OUTPUT', remixOutput: value }),
    onVideoModeChange: (value) => send({ type: 'SET_VIDEO_MODE', videoMode: value }),
    onMotionPromptChange: (value) => send({ type: 'SET_MOTION_PROMPT', motionPrompt: value }),
    onGiphyQueryChange: (query) => send({ type: 'SET_GIPHY_QUERY', query }),
    onGiphySearch,
    onPickGiphy: (g) => send({ type: 'PICK_GIPHY', pick: g }),
    onUrlChange: (url) => send({ type: 'SET_IMAGE_URL', imageUrl: url, edited: false }),
    onResolvePageUrl,
    onApplyGiphyEdit: () => {
      const pick = actor.getSnapshot().context.giphyPick
      if (pick) void applyEdit(pick.stillUrl)
    },
    onApplyUrlEdit: () => {
      const url = actor.getSnapshot().context.imageUrl
      if (url) void applyEdit(url)
    },
    onImageFile,
    onVideoFile,
    onRemix,
    onAnimateEdited,
    onGenerate,
    onMint,
  }
}
