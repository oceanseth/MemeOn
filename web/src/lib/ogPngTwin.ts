import { uploadCreateMemeFile } from './createMemeUpload'

/** Mirrors the server's mint rule (POST /api/memes): webp art needs a png twin. */
const WEBP_URL = /\.webp($|\?)/i

/**
 * webp art (possibly animated) mints as-is, but the server's og-card compositor
 * (jimp) can't decode webp — so render the first frame to a png, upload it, and
 * send the URL along as `ogImageUrl`. Non-webp art needs no twin (null). Any
 * conversion failure also returns null: the server's 400 then names the miss
 * instead of the client inventing one.
 */
export async function ogPngTwin(imageUrl: string): Promise<string | null> {
  if (!WEBP_URL.test(imageUrl)) return null
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    // createImageBitmap decodes exactly the first frame of an animated webp
    const bitmap = await createImageBitmap(await res.blob())
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0)
    const png = await canvas.convertToBlob({ type: 'image/png' })
    return await uploadCreateMemeFile(png, 'image/png')
  } catch {
    return null
  }
}
