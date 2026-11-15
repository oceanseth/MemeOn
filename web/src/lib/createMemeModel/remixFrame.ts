import { corsFresh } from '../corsFresh'
import { uploadCreateMemeFile } from '../createMemeUpload'
import { grabVideoFrame } from '../extractPoster'
import type { Meme } from '../types'

/** How far a poster's ratio may sit from its video's and still count as the whole frame. */
const SAME_SHAPE_TOLERANCE = 0.02

/* one upload per source video for the page's lifetime: a re-run of the edit reuses the frame */
const uploaded = new Map<string, string>()

/**
 * The image a remix edits. For an image meme that is its art. For a video meme it is a frame of
 * the video itself whenever the stored poster is a different shape: posters minted before frames
 * kept their video's shape are square crops, and a crop that cut a caption in half teaches the
 * edit model to paint a caption that runs off the card. Anything that stops the frame being read
 * (a host without CORS, a stalled download, a failed upload) falls back to the poster.
 */
export async function remixSourceImage(source: Meme): Promise<string> {
  if (source.mediaType !== 'video' || !source.videoUrl) return source.imageUrl
  const known = uploaded.get(source.videoUrl)
  if (known) return known
  try {
    const frame = await grabVideoFrame(corsFresh(source.videoUrl), true)
    if (posterMatches(source, frame.width / frame.height)) return source.imageUrl
    const url = await uploadCreateMemeFile(frame.blob, 'image/png')
    uploaded.set(source.videoUrl, url)
    return url
  } catch {
    return source.imageUrl
  }
}

function posterMatches(source: Meme, videoRatio: number): boolean {
  if (!source.width || !source.height) return false
  const posterRatio = source.width / source.height
  return Math.abs(posterRatio - videoRatio) / videoRatio <= SAME_SHAPE_TOLERANCE
}

/** Test seam: forget every uploaded frame. */
export function resetRemixFrames(): void {
  uploaded.clear()
}
