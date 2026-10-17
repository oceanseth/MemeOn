import { createMemeCopy } from '../../copy/createMeme'
import { readClipboardImage } from '../clipboardImage'
import type { CreateMemeActionHost } from './actionHost'
import { onImageFile, onVideoFile } from './uploadActions'

const copy = createMemeCopy

/** The Paste button: read the clipboard on the user's gesture and treat the image as a pick. */
export async function onClipboardPaste(host: CreateMemeActionHost): Promise<void> {
  let file: File | null
  try {
    file = await readClipboardImage()
  } catch {
    /* refused permission or an unreadable clipboard — reported in place, no busy flash */
    host.send({ type: 'FAIL', err: copy.errors.clipboardReadFailed })
    return
  }
  if (!file) {
    host.send({ type: 'FAIL', err: copy.errors.clipboardEmpty })
    return
  }
  await onImageFile(host, file)
}

/**
 * A Ctrl+V anywhere on the mint desk: route the pasted file to its well. Returns whether the
 * paste was consumed, so the hook knows to `preventDefault`. An image wins over a video when a
 * paste somehow carries both — the two wells share one upload id and starting both would retire
 * one. Files belong to the upload tab, so a paste landing on any other tab hops there first.
 */
export function onPasteCapture(
  host: CreateMemeActionHost,
  data: DataTransfer | null,
  targetTakesText: boolean,
): boolean {
  if (!data) return false
  const files = Array.from(data.files)
  const image = files.find((file) => file.type.startsWith('image/'))
  const video = files.find((file) => file.type.startsWith('video/'))
  if (!image && !video) return false
  /* text and an image copied together (a web-page selection): a paste aimed at a text field is
     still a text paste */
  if (targetTakesText && data.types.includes('text/plain')) return false
  if (host.getCtx().mode !== 'upload') host.send({ type: 'SELECT_MODE', mode: 'upload' })
  if (image) void onImageFile(host, image)
  else if (video) void onVideoFile(host, video)
  return true
}
