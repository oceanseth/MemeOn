import { beforeEach, describe, expect, it, vi } from 'vitest'
import { paperMeme } from '../../test/fixtures'
import type { Meme } from '../types'
import { remixSourceImage, resetRemixFrames } from './remixFrame'

const { uploadCreateMemeFile, grabVideoFrame } = vi.hoisted(() => ({
  uploadCreateMemeFile: vi.fn(),
  grabVideoFrame: vi.fn(),
}))

vi.mock('../createMemeUpload', () => ({ uploadCreateMemeFile }))
vi.mock('../extractPoster', () => ({ grabVideoFrame }))

const POSTER = 'https://files/poster.png'
const VIDEO = 'https://files/clip.mp4'
const FRAME = 'https://files/frame.png'
const blob = { size: 9 } as Blob

/** a landscape clip whose stored poster is the old square crop */
function croppedVideoMeme(over: Partial<Meme> = {}): Meme {
  return {
    ...paperMeme,
    mediaType: 'video',
    imageUrl: POSTER,
    videoUrl: VIDEO,
    width: 720,
    height: 720,
    ...over,
  }
}

describe('remixSourceImage', () => {
  beforeEach(() => {
    resetRemixFrames()
    uploadCreateMemeFile.mockReset()
    grabVideoFrame.mockReset()
    uploadCreateMemeFile.mockResolvedValue(FRAME)
    grabVideoFrame.mockResolvedValue({ blob, width: 640, height: 424 })
  })

  it('edits an image meme from its own art without touching a video', async () => {
    const meme = { ...paperMeme, imageUrl: POSTER }
    await expect(remixSourceImage(meme)).resolves.toBe(POSTER)
    expect(grabVideoFrame).not.toHaveBeenCalled()
  })

  it('swaps a square-cropped poster for the whole frame of its landscape video', async () => {
    await expect(remixSourceImage(croppedVideoMeme())).resolves.toBe(FRAME)
    expect(grabVideoFrame).toHaveBeenCalledWith(`${VIDEO}?frame=1`, true)
    expect(uploadCreateMemeFile).toHaveBeenCalledWith(blob, 'image/png')
  })

  it('keeps the poster when it already has the shape of the video', async () => {
    const meme = croppedVideoMeme({ width: 1280, height: 848 })
    await expect(remixSourceImage(meme)).resolves.toBe(POSTER)
    expect(uploadCreateMemeFile).not.toHaveBeenCalled()
  })

  it('takes the frame when the poster was never measured', async () => {
    const { width: _width, height: _height, ...meme } = croppedVideoMeme()
    await expect(remixSourceImage(meme)).resolves.toBe(FRAME)
  })

  it('uploads one frame per video however often the edit is re-run', async () => {
    await remixSourceImage(croppedVideoMeme())
    await expect(remixSourceImage(croppedVideoMeme())).resolves.toBe(FRAME)
    expect(grabVideoFrame).toHaveBeenCalledTimes(1)
    expect(uploadCreateMemeFile).toHaveBeenCalledTimes(1)
  })

  it('falls back to the poster when the video cannot be read', async () => {
    grabVideoFrame.mockRejectedValue(new Error('could not read video'))
    await expect(remixSourceImage(croppedVideoMeme())).resolves.toBe(POSTER)
  })

  it('falls back to the poster when the frame upload fails, and tries again next time', async () => {
    uploadCreateMemeFile.mockRejectedValueOnce(new Error('upload rejected'))
    await expect(remixSourceImage(croppedVideoMeme())).resolves.toBe(POSTER)
    await expect(remixSourceImage(croppedVideoMeme())).resolves.toBe(FRAME)
  })

  it('keeps the query a signed video url already carries', async () => {
    await remixSourceImage(croppedVideoMeme({ videoUrl: `${VIDEO}?token=abc` }))
    expect(grabVideoFrame).toHaveBeenCalledWith(`${VIDEO}?token=abc&frame=1`, true)
  })
})
