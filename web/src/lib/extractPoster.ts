/** Grab the first frame of a video file as a PNG blob (browser-side, no server).
 *  Legacy: canvas/video frame grab. Do not molecularize. */
export function extractPoster(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = url
    const fail = (why: string) => {
      URL.revokeObjectURL(url)
      reject(new Error(why))
    }
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
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => (b ? resolve(b) : fail('poster encode failed')), 'image/png')
    }
  })
}
