import { createMemeCopy } from '../../copy/createMeme'
import { mintDeskError } from '../createMemeMintError'
import { uploadCreateMemeFile } from '../createMemeUpload'
import { extractPoster } from '../extractPoster'
import type { CreateMemeActionHost } from './actionHost'
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, overCapMessage } from './shared'

const copy = createMemeCopy

/* Image and video share one id. Over-cap returns before the increment, so a too-big
   pick does not retire an in-flight put. */
let latestUpload = 0

export async function onImageFile(host: CreateMemeActionHost, file: File): Promise<void> {
  /* the row names what was picked before it judges it: the oversized file is still the one
     sitting in the picker when the alert explains why it will not do */
  host.send({ type: 'SET_FILE_NAME', kind: 'image', name: file.name })
  if (file.size > MAX_IMAGE_BYTES) {
    host.send({
      type: 'FAIL',
      err: overCapMessage('image', file.size, MAX_IMAGE_BYTES),
    })
    return
  }
  const uploadId = ++latestUpload
  host.beginBusy(copy.busy.uploadingImage)
  try {
    const imageUrl = await uploadCreateMemeFile(file)
    if (uploadId !== latestUpload) return
    host.send({
      type: 'SET_IMAGE_URL',
      imageUrl,
      fileName: file.name,
    })
    host.settleBusy({ type: 'DONE' })
  } catch (er) {
    if (uploadId !== latestUpload) return
    host.settleBusy({
      type: 'FAIL',
      err: mintDeskError(er, copy.errors.uploadFailed),
    })
  }
}

export async function onVideoFile(host: CreateMemeActionHost, file: File): Promise<void> {
  host.send({ type: 'SET_FILE_NAME', kind: 'video', name: file.name })
  if (file.size > MAX_VIDEO_BYTES) {
    host.send({
      type: 'FAIL',
      err: overCapMessage('video', file.size, MAX_VIDEO_BYTES),
    })
    return
  }
  const uploadId = ++latestUpload
  host.beginBusy(copy.busy.uploadingVideo)
  try {
    const videoUrl = await uploadCreateMemeFile(file)
    if (uploadId !== latestUpload) return
    host.send({
      type: 'SET_VIDEO_URL',
      videoUrl,
      fileName: file.name,
    })
    if (!host.getCtx().imageUrl) {
      host.send({ type: 'BUSY', busy: copy.busy.extractingPoster })
      const poster = await extractPoster(file)
      if (uploadId !== latestUpload) return
      const imageUrl = await uploadCreateMemeFile(poster, 'image/png')
      if (uploadId !== latestUpload) return
      host.send({ type: 'SET_IMAGE_URL', imageUrl })
    }
    host.settleBusy({ type: 'DONE' })
  } catch (er) {
    if (uploadId !== latestUpload) return
    host.settleBusy({
      type: 'FAIL',
      err: mintDeskError(er, copy.errors.uploadFailed),
    })
  }
}
