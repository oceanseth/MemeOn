import { useProjectedActor } from './useProjectedActor'
import { useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createMemeCopy } from '../copy/createMeme'
import { apiFetch, post } from '../lib/api'
import { uploadCreateMemeFile } from '../lib/createMemeUpload'
import {
  assertActive,
  cancelVideoPollForOwner,
  isLifetimeCancellation,
  POLL_TIMEOUT_MS,
  pollVideoStatus,
  type CreationLifetime,
  type VideoPollRun,
} from '../lib/createMemeVideoPoll'
import { extractPoster } from '../lib/extractPoster'
import {
  buildCreateMemeScreenModel,
  draftOf,
  elapsedLabel,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  overCapMessage,
  pendingVideoMatchesRemix,
  pendingVideoRecord,
  type CreateMemeScreenModel,
} from '../lib/createMemeModel'
import { clearPendingVideo, getPendingVideo, setPendingVideo } from '../lib/sessionBus'
import type { GiphyResult, Meme } from '../lib/types'
import {
  createMemeMachine,
  type CreateMemeDraft,
  type CreateMemeEvent,
  type CreateMemeMode,
  type CreateMemePhase,
} from '../stores/createMemeMachine'
import { useMountEffect } from './useMountEffect'

export type { CreateMemeScreenModel } from '../lib/createMemeModel'

const copy = createMemeCopy

export { pendingVideoMatchesRemix, pendingVideoRecord, draftOf } from '../lib/createMemeModel'
export { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, overCapMessage } from '../lib/createMemeModel'

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
      const raw = getPendingVideo()
      if (!raw) return
      try {
        const pending = JSON.parse(raw) as { generationId: string; startedAt: number; draft?: CreateMemeDraft }
        setPendingVideo(JSON.stringify({ ...pending, draft: draftOf(actor.getSnapshot().context) }))
      } catch {
        /* A malformed record is handled by the mount-time recovery path. */
      }
    }, 400)
  }, [actor])

  const persistPendingVideo = useCallback(
    (generationId: string, startedAt: number) => {
      const live = actor.getSnapshot().context
      setPendingVideo(JSON.stringify(pendingVideoRecord(live, generationId, startedAt)))
    },
    [actor],
  )

  const pollVideo = useCallback(
    (generationId: string, startedAt: number, owner: CreationLifetime): Promise<string> =>
      pollVideoStatus(pollRunRef, generationId, startedAt, owner, persistPendingVideo),
    [persistPendingVideo],
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

    const raw = getPendingVideo()
    if (raw) {
      try {
        const pending = JSON.parse(raw) as Partial<ReturnType<typeof pendingVideoRecord>> & {
          generationId: string
          startedAt: number
        }
        if (Date.now() - pending.startedAt > POLL_TIMEOUT_MS) {
          clearPendingVideo()
        } else if (pendingVideoMatchesRemix(pending.remixId, remixId)) {
          if (pending.imageUrl) send({ type: 'SET_IMAGE_URL', imageUrl: pending.imageUrl })
          if (pending.draft) send({ type: 'RESTORE_DRAFT', draft: pending.draft })
          beginBusy(copy.busy.resumingRender, pending.startedAt)
          void pollVideo(pending.generationId, pending.startedAt, owner)
            .then((url) => {
              assertActive(owner)
              send({ type: 'SET_VIDEO_URL', videoUrl: url })
              settleBusy({ type: 'DONE' })
            })
            .catch((e) => {
              if (!owner.active || isLifetimeCancellation(e)) return
              settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.renderFailed })
            })
        }
      } catch {
        clearPendingVideo()
      }
    }

    return () => {
      owner.active = false
      if (lifetimeRef.current === owner) lifetimeRef.current = null
      stopElapsed()
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
      cancelVideoPollForOwner(pollRunRef, owner)
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
      beginBusy(copy.busy.searchingGiphy)
      try {
        const r = await apiFetch<{ results: GiphyResult[] }>(
          `/api/giphy/search?q=${encodeURIComponent(q)}`,
        )
        send({ type: 'SET_GIPHY_RESULTS', results: r.results })
        settleBusy({ type: 'DONE' })
      } catch (e) {
        settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.giphySearchFailed })
      }
    },
    [beginBusy, send, settleBusy],
  )

  const onResolvePageUrl = useCallback(async () => {
    const url = actor.getSnapshot().context.urlDraft.trim()
    if (!url) return
    if (!/^https?:\/\//.test(url)) {
      send({ type: 'FAIL', err: copy.errors.notALink })
      return
    }
    if (/\.(png|jpe?g|gif|webp)($|\?)/i.test(url)) {
      send({ type: 'SET_RESOLVED', imageUrl: url, videoUrl: null, source: null })
      return
    }
    beginBusy(copy.busy.resolvingPage)
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
      settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.resolveFailed })
    }
  }, [actor, beginBusy, send, settleBusy])

  const applyEdit = useCallback(
    async (sourceUrl: string) => {
      beginBusy(copy.busy.editing)
      try {
        const out = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
          prompt: actor.getSnapshot().context.prompt,
          imageUrls: [sourceUrl],
        })
        send({ type: 'SET_IMAGE_URL', imageUrl: out.imageUrl, edited: true })
        settleBusy({ type: 'DONE' })
      } catch (e) {
        settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.editFailed })
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
        ? copy.busy.remixImage
        : live.videoMode === 'restyle' &&
            live.remixSource.mediaType === 'video' &&
            live.remixSource.videoUrl
          ? copy.busy.restyleVideo
          : copy.busy.editFrame
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
        send({ type: 'BUSY', busy: copy.busy.restyleVideo })
        send({ type: 'SET_IMAGE_URL', imageUrl: live.remixSource.imageUrl })
        const started = await post<{ generationId: string }>('/api/aigen/video', {
          prompt: live.prompt,
          srcVideo: live.remixSource.videoUrl,
        })
        assertActive(owner)
        send({ type: 'BUSY', busy: copy.busy.renderingRemix })
        const videoUrl = await pollVideo(started.generationId, Date.now(), owner)
        assertActive(owner)
        send({ type: 'SET_VIDEO_URL', videoUrl })
      } else {
        send({ type: 'BUSY', busy: copy.busy.editFrame })
        const edited = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
          /* prompt text for the generation API, never shown: not copy */
          prompt: `${live.prompt}${copy.prompts.keepIdentical}`,
          imageUrls: [live.remixSource.imageUrl],
        })
        assertActive(owner)
        send({ type: 'SET_EDITED_FRAME', imageUrl: edited.imageUrl })
      }
      assertActive(owner)
      settleBusy({ type: 'DONE' })
    } catch (e) {
      if (!owner.active || isLifetimeCancellation(e)) return
      settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.remixFailed })
    }
  }, [actor, beginBusy, pollVideo, send, settleBusy])

  const onGenerate = useCallback(async () => {
    const owner = lifetimeRef.current
    if (!owner?.active) return
    const live = actor.getSnapshot().context
    if (live.mode === 'video') {
      beginBusy(copy.busy.startingVideo)
      try {
        const thumb = await post<{ imageUrl: string }>('/api/aigen/image', {
          /* prompt text for the generation API, never shown: not copy */
          prompt: `${live.prompt}${copy.prompts.videoThumbnailSuffix}`,
          aspectRatio: '1:1',
        })
        assertActive(owner)
        send({ type: 'SET_IMAGE_URL', imageUrl: thumb.imageUrl })
        const started = await post<{ generationId: string }>('/api/aigen/video', { prompt: live.prompt })
        assertActive(owner)
        send({ type: 'BUSY', busy: copy.busy.renderingVideo })
        const videoUrl = await pollVideo(started.generationId, Date.now(), owner)
        assertActive(owner)
        send({ type: 'SET_VIDEO_URL', videoUrl })
        settleBusy({ type: 'DONE' })
      } catch (e) {
        if (!owner.active || isLifetimeCancellation(e)) return
        settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.videoGenerationFailed })
      }
      return
    }
    beginBusy(copy.busy.generatingImage)
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
      settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.generationFailed })
    }
  }, [actor, beginBusy, pollVideo, send, settleBusy])

  const onAnimateEdited = useCallback(async () => {
    const owner = lifetimeRef.current
    if (!owner?.active) return
    const live = actor.getSnapshot().context
    if (!live.editedFrame) return
    beginBusy(copy.busy.animatingFrame)
    try {
      const isVideoSource = live.remixSource?.mediaType === 'video' && live.remixSource.videoUrl
      const started = await post<{ generationId: string }>('/api/aigen/video', {
        /* prompt text for the generation API, never shown: not copy */
        prompt: isVideoSource
          ? live.motionPrompt.trim()
            ? copy.prompts.motionWithEdit(live.motionPrompt.trim())
            : copy.prompts.motionFromReference
          : live.motionPrompt.trim() || copy.prompts.motionDefault,
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
      settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.animationFailed })
    }
  }, [actor, beginBusy, pollVideo, send, settleBusy])

  const onMint = useCallback(async () => {
    const live = actor.getSnapshot().context
    beginBusy(copy.busy.minting)
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
      settleBusy({ type: 'FAIL', err: e instanceof Error ? e.message : copy.errors.mintFailed })
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
      /* the row names what was picked before it judges it: the oversized file is still the one
         sitting in the picker when the alert explains why it will not do */
      send({ type: 'SET_FILE_NAME', kind: 'image', name: file.name })
      if (file.size > MAX_IMAGE_BYTES) {
        send({ type: 'FAIL', err: overCapMessage('image', file.size, MAX_IMAGE_BYTES) })
        return
      }
      beginBusy(copy.busy.uploadingImage)
      try {
        send({
          type: 'SET_IMAGE_URL',
          imageUrl: await uploadCreateMemeFile(file),
          fileName: file.name,
        })
        settleBusy({ type: 'DONE' })
      } catch (er) {
        settleBusy({ type: 'FAIL', err: er instanceof Error ? er.message : copy.errors.uploadFailed })
      }
    },
    [beginBusy, send, settleBusy],
  )

  const onVideoFile = useCallback(
    async (file: File) => {
      send({ type: 'SET_FILE_NAME', kind: 'video', name: file.name })
      if (file.size > MAX_VIDEO_BYTES) {
        send({ type: 'FAIL', err: overCapMessage('video', file.size, MAX_VIDEO_BYTES) })
        return
      }
      beginBusy(copy.busy.uploadingVideo)
      try {
        send({
          type: 'SET_VIDEO_URL',
          videoUrl: await uploadCreateMemeFile(file),
          fileName: file.name,
        })
        if (!actor.getSnapshot().context.imageUrl) {
          send({ type: 'BUSY', busy: copy.busy.extractingPoster })
          const poster = await extractPoster(file)
          send({ type: 'SET_IMAGE_URL', imageUrl: await uploadCreateMemeFile(poster, 'image/png') })
        }
        settleBusy({ type: 'DONE' })
      } catch (er) {
        settleBusy({ type: 'FAIL', err: er instanceof Error ? er.message : copy.errors.uploadFailed })
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
