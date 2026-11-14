import { describe, expect, it } from 'vitest'
import { extractPoster } from './extractPoster'

/* A real landscape clip, recorded here from a canvas: Chromium ships no H.264, so the fixture
   is the webm the browser itself encodes. The left and right thirds are the parts a square
   cover-crop used to throw away. */
async function landscapeClip(width: number, height: number): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('no 2d context')
  const paint = () => {
    context.fillStyle = 'rgb(255 0 0)'
    context.fillRect(0, 0, width / 3, height)
    context.fillStyle = 'rgb(0 255 0)'
    context.fillRect(width / 3, 0, width / 3, height)
    context.fillStyle = 'rgb(0 0 255)'
    context.fillRect((2 * width) / 3, 0, width / 3, height)
  }
  paint()
  const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: 'video/webm' })
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => chunks.push(event.data)
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })
  recorder.start()
  const repaint = setInterval(paint, 30)
  await new Promise((resolve) => setTimeout(resolve, 700))
  clearInterval(repaint)
  recorder.stop()
  await stopped
  return new File(chunks, 'clip.webm', { type: 'video/webm' })
}

describe('extractPoster', () => {
  it('keeps the whole frame of a landscape video, edge to edge', async () => {
    const poster = await extractPoster(await landscapeClip(480, 240))
    const bitmap = await createImageBitmap(poster)
    expect([bitmap.width, bitmap.height]).toEqual([480, 240])

    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('no 2d context')
    context.drawImage(bitmap, 0, 0)
    const [leftRed] = context.getImageData(20, 120, 1, 1).data
    const rightEdge = context.getImageData(460, 120, 1, 1).data
    // the outer thirds survive: red at the far left, blue at the far right
    expect(leftRed).toBeGreaterThan(180)
    expect(rightEdge[2]).toBeGreaterThan(180)
  })
})
