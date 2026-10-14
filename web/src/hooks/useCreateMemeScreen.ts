import { useProjectedActor } from './useProjectedActor'
import { useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createMemeCopy } from '../copy/createMeme'
import { apiFetch } from '../lib/api'
import { mintDeskError } from '../lib/createMemeMintError'
import {
  assertActive,
  cancelVideoPollForOwner,
  isLifetimeCancellation,
  pollVideoStatus,
  type CreationLifetime,
  type VideoPollRun,
} from '../lib/createMemeVideoPoll'
import {
  buildCreateMemeScreenModel,
  createDraftPersister,
  elapsedLabel,
  persistPendingVideo,
  takePendingVideoRestore,
  type CreateMemeScreenModel,
} from '../lib/createMemeModel'
import { probeClipboardImage, supportsClipboardRead, takesTextPaste } from '../lib/clipboardImage'
import type { CreateMemeActionHost } from '../lib/createMemeModel/actionHost'
import { onClipboardPaste, onPasteCapture } from '../lib/createMemeModel/clipboardActions'
import { onAnimateEdited, onGenerate } from '../lib/createMemeModel/generateActions'
import { loadGiphyCategories, onGiphySearch } from '../lib/createMemeModel/giphyActions'
import { applyGiphyEdit, applyUrlEdit } from '../lib/createMemeModel/imageEdit'
import { onMint } from '../lib/createMemeModel/mintActions'
import { onRemix } from '../lib/createMemeModel/remixActions'
import { onImageFile, onVideoFile } from '../lib/createMemeModel/uploadActions'
import { onResolvePageUrl } from '../lib/createMemeModel/urlActions'
import type { Meme } from '../lib/types'
import {
  createMemeMachine,
  type CreateMemeEvent,
  type CreateMemeMode,
  type CreateMemePhase,
} from '../stores/createMemeMachine'
import { useMountEffect } from './useMountEffect'

export type { CreateMemeScreenModel } from '../lib/createMemeModel'

const copy = createMemeCopy

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
  const draftPersisterRef = useRef<ReturnType<typeof createDraftPersister> | null>(null)

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

  const persistPending = useCallback(
    (generationId: string, startedAt: number) => {
      persistPendingVideo(actor.getSnapshot().context, generationId, startedAt)
    },
    [actor],
  )

  const pollVideo = useCallback(
    (generationId: string, startedAt: number, owner: CreationLifetime): Promise<string> =>
      pollVideoStatus(pollRunRef, generationId, startedAt, owner, persistPending),
    [persistPending],
  )

  const scheduleDraft = useCallback(() => {
    draftPersisterRef.current?.schedule()
  }, [])

  const host: CreateMemeActionHost = {
    getCtx: () => actor.getSnapshot().context,
    send,
    beginBusy,
    settleBusy,
    pollVideo,
    getOwner: () => lifetimeRef.current,
  }

  /* silent: reads only behind an already-granted permission, so no prompt ever fires uninvited */
  const refreshClipboardHint = useCallback(() => {
    if (!supportsClipboardRead()) return
    void probeClipboardImage().then((hint) => {
      if (!lifetimeRef.current?.active) return
      if (actor.getSnapshot().context.clipboardHint !== hint) {
        send({ type: 'SET_CLIPBOARD_HINT', hint })
      }
    })
  }, [actor, send])

  useMountEffect(() => {
    const owner: CreationLifetime = { active: true }
    lifetimeRef.current = owner
    const persister = createDraftPersister(() => actor.getSnapshot().context)
    draftPersisterRef.current = persister
    if (remixId) {
      apiFetch<{ meme: Meme }>(`/api/memes/${remixId}`)
        .then((r) => {
          if (owner.active) send({ type: 'SET_REMIX_SOURCE', meme: r.meme })
        })
        .catch(() => {
          if (owner.active) send({ type: 'REMIX_SOURCE_MISSING' })
        })
    }

    const restore = takePendingVideoRestore(remixId, Date.now())
    if (restore.kind === 'resume') {
      const { record } = restore
      if (record.imageUrl) send({ type: 'SET_IMAGE_URL', imageUrl: record.imageUrl })
      if (record.draft) send({ type: 'RESTORE_DRAFT', draft: record.draft })
      beginBusy(copy.busy.resumingRender, record.startedAt)
      void pollVideo(record.generationId, record.startedAt, owner)
        .then((url) => {
          assertActive(owner)
          send({ type: 'SET_VIDEO_URL', videoUrl: url })
          settleBusy({ type: 'DONE' })
        })
        .catch((e) => {
          if (!owner.active || isLifetimeCancellation(e)) return
          settleBusy({
            type: 'FAIL',
            err: mintDeskError(e, copy.errors.renderFailed),
          })
        })
    }

    /* the upload desk takes a Ctrl+V from anywhere on the page, so the listener is the
       document's; whether it applies is read off the live snapshot at paste time */
    const onPaste = (event: ClipboardEvent) => {
      const snapshot = actor.getSnapshot()
      if (snapshot.context.mode !== 'upload' || snapshot.context.busy) return
      if (snapshot.value === 'success') return
      if (onPasteCapture(host, event.clipboardData, takesTextPaste(event.target))) {
        event.preventDefault()
      }
    }
    document.addEventListener('paste', onPaste)
    /* what the clipboard holds changes while the tab is away; re-probe each time it comes back */
    window.addEventListener('focus', refreshClipboardHint)
    refreshClipboardHint()

    return () => {
      owner.active = false
      if (lifetimeRef.current === owner) lifetimeRef.current = null
      document.removeEventListener('paste', onPaste)
      window.removeEventListener('focus', refreshClipboardHint)
      stopElapsed()
      persister.dispose()
      if (draftPersisterRef.current === persister) draftPersisterRef.current = null
      cancelVideoPollForOwner(pollRunRef, owner)
    }
  })

  const onSelectMode = (mode: CreateMemeMode) => {
    send({ type: 'SELECT_MODE', mode })
    if (mode === 'giphy') loadGiphyCategories(host)
    if (mode === 'upload') refreshClipboardHint()
  }

  const onCopyShareLink = async () => {
    const { shareUrl } = actor.getSnapshot().context
    if (!shareUrl) return
    if (!navigator.clipboard?.writeText) {
      send({ type: 'SHARE_COPY_FAILED' })
      return
    }
    try {
      // called on navigator.clipboard: a detached writeText rejects with Illegal invocation
      await navigator.clipboard.writeText(shareUrl)
      send({ type: 'SHARE_COPIED' })
    } catch {
      send({ type: 'SHARE_COPY_FAILED' })
    }
  }

  return buildCreateMemeScreenModel(phase, ctx, {
    selectMode: onSelectMode,
    setTitle: (title) => {
      send({ type: 'SET_TITLE', title })
      scheduleDraft()
    },
    setTags: (tags) => {
      send({ type: 'SET_TAGS', tags })
      scheduleDraft()
    },
    setPrompt: (prompt) => {
      send({ type: 'SET_PROMPT', prompt })
      scheduleDraft()
    },
    setRemixOutput: (remixOutput) => send({ type: 'SET_REMIX_OUTPUT', remixOutput }),
    setVideoMode: (videoMode) => send({ type: 'SET_VIDEO_MODE', videoMode }),
    setMotionPrompt: (motionPrompt) => {
      send({ type: 'SET_MOTION_PROMPT', motionPrompt })
      scheduleDraft()
    },
    setGiphyQuery: (query) => send({ type: 'SET_GIPHY_QUERY', query }),
    searchGiphy: (q) => onGiphySearch(host, q),
    pickGiphy: (pick) => send({ type: 'PICK_GIPHY', pick }),
    setUrl: (urlDraft) => send({ type: 'SET_URL_DRAFT', urlDraft }),
    resolvePageUrl: () => onResolvePageUrl(host),
    applyGiphyEdit: () => applyGiphyEdit(host),
    applyUrlEdit: () => applyUrlEdit(host),
    uploadImage: (file) => onImageFile(host, file),
    uploadVideo: (file) => onVideoFile(host, file),
    pasteClipboard: () => onClipboardPaste(host),
    remix: () => onRemix(host),
    animateEdited: () => onAnimateEdited(host),
    generate: () => onGenerate(host),
    mint: () => onMint(host),
    copyShareLink: onCopyShareLink,
  })
}
