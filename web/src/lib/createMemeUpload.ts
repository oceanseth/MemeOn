import { createMemeCopy } from '../copy/createMeme'
import { post } from './api'

const copy = createMemeCopy

/** Signed PUT upload for create-meme image/video blobs; throws copy.errors.uploadRejected on failure. */
export async function uploadCreateMemeFile(
  file: File | Blob,
  contentType?: string,
): Promise<string> {
  const type = contentType ?? (file as File).type
  const { uploadUrl, publicUrl } = await post<{
    uploadUrl: string
    publicUrl: string
  }>('/api/uploads', { contentType: type, size: file.size })
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': type },
    body: file,
  })
  // the message is what the alert shows, so it is copy rather than a developer note
  if (!put.ok) throw new Error(copy.errors.uploadRejected(put.status))
  return publicUrl
}
