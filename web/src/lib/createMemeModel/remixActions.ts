import { createMemeCopy } from '../../copy/createMeme'
import { post } from '../api'
import { mintDeskError } from '../createMemeMintError'
import { assertActive, isLifetimeCancellation } from '../createMemeVideoPoll'
import type { CreateMemeActionHost } from './actionHost'

const copy = createMemeCopy

export async function onRemix(host: CreateMemeActionHost): Promise<void> {
  const owner = host.getOwner()
  if (!owner?.active) return
  const live = host.getCtx()
  if (!live.remixSource) return
  const remixBusy =
    live.remixOutput === 'image'
      ? copy.busy.remixImage
      : live.videoMode === 'restyle' &&
          live.remixSource.mediaType === 'video' &&
          live.remixSource.videoUrl
        ? copy.busy.restyleVideo
        : copy.busy.editFrame
  host.beginBusy(remixBusy)
  try {
    if (live.remixOutput === 'image') {
      const out = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
        prompt: live.prompt,
        imageUrls: [live.remixSource.imageUrl],
      })
      assertActive(owner)
      host.send({ type: 'SET_IMAGE_URL', imageUrl: out.imageUrl })
      host.send({ type: 'SET_VIDEO_URL', videoUrl: '' })
    } else if (
      live.videoMode === 'restyle' &&
      live.remixSource.mediaType === 'video' &&
      live.remixSource.videoUrl
    ) {
      host.send({ type: 'BUSY', busy: copy.busy.restyleVideo })
      host.send({ type: 'SET_IMAGE_URL', imageUrl: live.remixSource.imageUrl })
      const started = await post<{ generationId: string }>('/api/aigen/video', {
        prompt: live.prompt,
        srcVideo: live.remixSource.videoUrl,
      })
      assertActive(owner)
      host.send({ type: 'BUSY', busy: copy.busy.renderingRemix })
      const videoUrl = await host.pollVideo(started.generationId, Date.now(), owner)
      assertActive(owner)
      host.send({ type: 'SET_VIDEO_URL', videoUrl })
    } else {
      host.send({ type: 'BUSY', busy: copy.busy.editFrame })
      const edited = await post<{ imageUrl: string }>('/api/aigen/image-edit', {
        /* prompt text for the generation API, never shown: not copy */
        prompt: `${live.prompt}${copy.prompts.keepIdentical}`,
        imageUrls: [live.remixSource.imageUrl],
      })
      assertActive(owner)
      host.send({ type: 'SET_EDITED_FRAME', imageUrl: edited.imageUrl })
    }
    assertActive(owner)
    host.settleBusy({ type: 'DONE' })
  } catch (e) {
    if (!owner.active || isLifetimeCancellation(e)) return
    host.settleBusy({
      type: 'FAIL',
      err: mintDeskError(e, copy.errors.remixFailed),
    })
  }
}
