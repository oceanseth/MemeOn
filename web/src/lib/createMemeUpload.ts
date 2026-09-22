import { createMemeCopy } from '../copy/createMeme'
import { post } from './api'

const copy = createMemeCopy

export const UPLOAD_TIMEOUT_MS = 60_000

/** Signed PUT for create-meme blobs. HTTP failure throws uploadRejected; a stalled PUT aborts. */
export async function uploadCreateMemeFile(
  file: File | Blob,
  contentType?: string,
): Promise<string> {
  const type = contentType ?? (file as File).type
  const { uploadUrl, publicUrl } = await post<{
    uploadUrl: string
    publicUrl: string
  }>('/api/uploads', { contentType: type, size: file.size })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)
  try {
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': type },
      body: file,
      signal: controller.signal,
    })
    // the message is what the alert shows, so it is copy rather than a developer note
    if (!put.ok) throw new Error(copy.errors.uploadRejected(put.status))
    return publicUrl
  } finally {
    clearTimeout(timer)
  }
}
