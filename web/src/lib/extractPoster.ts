/** Grab the first frame of a video file as a PNG blob (browser-side, no server).
 *  Legacy: canvas/video frame grab. Do not molecularize. */
const POSTER_TIMEOUT_MS = 10_000

export function extractPoster(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
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
      URL.revokeObjectURL(url)
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
      const size = 720
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return fail('canvas unavailable')
      // cover-crop into a square
      const s = Math.min(video.videoWidth, video.videoHeight)
      ctx.drawImage(
        video,
        (video.videoWidth - s) / 2,
        (video.videoHeight - s) / 2,
        s,
        s,
        0,
        0,
        size,
        size,
      )
      canvas.toBlob(
        (b) => (b ? settle(() => resolve(b)) : fail('poster encode failed')),
        'image/png',
      )
    }
    video.src = url
  })
}
