import { createMemeCopy } from '../../copy/createMeme'
import { post } from '../api'
import { mintDeskError } from '../createMemeMintError'
import { assertActive, isLifetimeCancellation } from '../createMemeVideoPoll'
import type { CreateMemeActionHost } from './actionHost'

const copy = createMemeCopy

export async function onGenerate(host: CreateMemeActionHost): Promise<void> {
  const owner = host.getOwner()
  if (!owner?.active) return
  const live = host.getCtx()
  if (live.mode === 'video') {
    host.beginBusy(copy.busy.startingVideo)
    try {
      const thumb = await post<{ imageUrl: string }>('/api/aigen/image', {
        /* prompt text for the generation API, never shown: not copy */
        prompt: `${live.prompt}${copy.prompts.videoThumbnailSuffix}`,
        aspectRatio: '1:1',
      })
      assertActive(owner)
      host.send({ type: 'SET_IMAGE_URL', imageUrl: thumb.imageUrl })
      const started = await post<{ generationId: string }>('/api/aigen/video', {
        prompt: live.prompt,
      })
      assertActive(owner)
      host.send({ type: 'BUSY', busy: copy.busy.renderingVideo })
      const videoUrl = await host.pollVideo(started.generationId, Date.now(), owner)
      assertActive(owner)
      host.send({ type: 'SET_VIDEO_URL', videoUrl })
      host.settleBusy({ type: 'DONE' })
    } catch (e) {
      if (!owner.active || isLifetimeCancellation(e)) return
      host.settleBusy({
        type: 'FAIL',
        err: mintDeskError(e, copy.errors.videoGenerationFailed),
      })
    }
    return
  }
  host.beginBusy(copy.busy.generatingImage)
  try {
    const out = await post<{ imageUrl: string }>('/api/aigen/image', {
      prompt: live.prompt,
      aspectRatio: '1:1',
    })
    assertActive(owner)
    host.send({ type: 'SET_IMAGE_URL', imageUrl: out.imageUrl })
    host.settleBusy({ type: 'DONE' })
  } catch (e) {
    if (!owner.active || isLifetimeCancellation(e)) return
    host.settleBusy({
      type: 'FAIL',
      err: mintDeskError(e, copy.errors.generationFailed),
    })
  }
}

export async function onAnimateEdited(host: CreateMemeActionHost): Promise<void> {
  const owner = host.getOwner()
  if (!owner?.active) return
  const live = host.getCtx()
  if (!live.editedFrame) return
  host.beginBusy(copy.busy.animatingFrame)
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
    const videoUrl = await host.pollVideo(started.generationId, Date.now(), owner)
    assertActive(owner)
    host.send({ type: 'SET_VIDEO_URL', videoUrl })
    host.send({ type: 'CLEAR_EDITED_FRAME' })
    host.settleBusy({ type: 'DONE' })
  } catch (e) {
    if (!owner.active || isLifetimeCancellation(e)) return
    host.settleBusy({
      type: 'FAIL',
      err: mintDeskError(e, copy.errors.animationFailed),
    })
  }
}
