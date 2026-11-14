/** Grab the first frame of a video as a PNG blob (browser-side, no server).
 *  Legacy: canvas/video frame grab. Do not molecularize.
 *
 *  The frame keeps the video's own shape. It used to be cover-cropped into a square, which cut
 *  the sides off every landscape clip — and with them the ends of a caption burned into the
 *  footage. A remix then handed the edit model a caption that already ran off both edges, and the
 *  model copied exactly that. */
const POSTER_TIMEOUT_MS = 10_000

/** The longest side a grabbed frame keeps; smaller videos are never scaled up. */
export const POSTER_MAX_SIDE = 1280

export interface VideoFrame {
  blob: Blob
  /** the video's own pixel size, before any downscale */
  width: number
  height: number
}

/** The canvas size for a frame: the video's own ratio, the long side capped at `maxSide`. */
export function posterSize(
  videoWidth: number,
  videoHeight: number,
  maxSide: number = POSTER_MAX_SIDE,
): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(videoWidth, videoHeight))
  return {
    width: Math.max(1, Math.round(videoWidth * scale)),
    height: Math.max(1, Math.round(videoHeight * scale)),
  }
}

/**
 * The first frame of the video at `src`. A remote video has to be fetched with CORS
 * (`crossOrigin`) or the canvas it is drawn on cannot be read back; a host that refuses rejects
 * here like any unreadable video, and the caller falls back.
 */
export function grabVideoFrame(src: string, crossOrigin = false): Promise<VideoFrame> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    if (crossOrigin) video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    let done = false
    let timer: ReturnType<typeof setTimeout> | null = null
    /* one exit for every path: a video that never fires `seeked` used to strand the flow forever */
    const settle = (outcome: () => void) => {
      if (done) return
      done = true
      if (timer) clearTimeout(timer)
      video.onerror = null
      video.onloadeddata = null
      video.onseeked = null
      video.removeAttribute('src')
      outcome()
    }
    const fail = (why: string) => settle(() => reject(new Error(why)))
    timer = setTimeout(
      () => fail('could not read the first frame — upload a poster image instead'),
      POSTER_TIMEOUT_MS,
    )
    video.onerror = () => fail('could not read video')
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.1, video.duration || 0.1)
    }
    video.onseeked = () => {
      const { videoWidth, videoHeight } = video
      if (!videoWidth || !videoHeight) return fail('could not read video')
      const size = posterSize(videoWidth, videoHeight)
      const canvas = document.createElement('canvas')
      canvas.width = size.width
      canvas.height = size.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return fail('canvas unavailable')
      try {
        ctx.drawImage(video, 0, 0, size.width, size.height)
        canvas.toBlob(
          (b) =>
            b
              ? settle(() => resolve({ blob: b, width: videoWidth, height: videoHeight }))
              : fail('poster encode failed'),
          'image/png',
        )
      } catch {
        /* a canvas tainted by a video served without CORS throws on read-back */
        fail('could not read video')
      }
    }
    video.src = src
  })
}

export async function extractPoster(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    return (await grabVideoFrame(url)).blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
