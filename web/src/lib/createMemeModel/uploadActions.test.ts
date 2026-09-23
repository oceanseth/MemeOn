import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemeCopy } from '../../copy/createMeme'
import type { CreateMemeContext, CreateMemeEvent } from '../../stores/createMemeMachine'
import { deferred, settle } from '../../test/runtime'
import type { CreateMemeActionHost } from './actionHost'
import { MAX_IMAGE_BYTES, overCapMessage } from './shared'
import { baseCreateMemeContext } from './testContext'
import { onImageFile, onVideoFile } from './uploadActions'

const { uploadCreateMemeFile, extractPoster } = vi.hoisted(() => ({
  uploadCreateMemeFile: vi.fn(),
  extractPoster: vi.fn(),
}))

vi.mock('../createMemeUpload', () => ({ uploadCreateMemeFile }))
vi.mock('../extractPoster', () => ({ extractPoster }))

type Gate<T> = ReturnType<typeof deferred<T>>

const uploadGates: Gate<string>[] = []
const posterGates: Gate<Blob>[] = []

function picked(name: string, size: number): File {
  const type = name.endsWith('.mp4') ? 'video/mp4' : 'image/png'
  return { name, size, type } as File
}

function noPosterYet(): CreateMemeContext {
  return { ...baseCreateMemeContext, imageUrl: '' }
}

function uploadHost(ctx: CreateMemeContext): CreateMemeActionHost & { events: CreateMemeEvent[] } {
  const events: CreateMemeEvent[] = []
  const record = (event: CreateMemeEvent) => {
    events.push(event)
  }
  return {
    events,
    getCtx: () => ctx,
    send: record,
    beginBusy: (busy) => {
      record({ type: 'SUBMIT', busy })
    },
    settleBusy: record,
    pollVideo: () => Promise.reject(new Error('upload does not poll video')),
    getOwner: vi.fn(() => ({ active: true })),
  }
}

function holdUploads(): void {
  uploadGates.length = 0
  posterGates.length = 0
  uploadCreateMemeFile.mockReset()
  extractPoster.mockReset()
  uploadCreateMemeFile.mockImplementation(() => {
    const gate = deferred<string>()
    uploadGates.push(gate)
    return gate.promise
  })
  extractPoster.mockImplementation(() => {
    const gate = deferred<Blob>()
    posterGates.push(gate)
    return gate.promise
  })
}

function kinds(events: CreateMemeEvent[], type: CreateMemeEvent['type']): CreateMemeEvent[] {
  return events.filter((event) => event.type === type)
}

function startTwoImages(host: CreateMemeActionHost & { events: CreateMemeEvent[] }) {
  const earlier = onImageFile(host, picked('a.png', 12))
  const later = onImageFile(host, picked('b.png', 18))
  const started: CreateMemeEvent[] = [
    { type: 'SET_FILE_NAME', kind: 'image', name: 'a.png' },
    { type: 'SUBMIT', busy: createMemeCopy.busy.uploadingImage },
    { type: 'SET_FILE_NAME', kind: 'image', name: 'b.png' },
    { type: 'SUBMIT', busy: createMemeCopy.busy.uploadingImage },
  ]
  return { earlier, later, started }
}

function imageApplied(
  started: CreateMemeEvent[],
  imageUrl: string,
  fileName: string,
): CreateMemeEvent[] {
  return [...started, { type: 'SET_IMAGE_URL', imageUrl, fileName }, { type: 'DONE' }]
}

describe('create-meme file uploads', () => {
  beforeEach(() => {
    holdUploads()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the later image when the earlier put resolves first', async () => {
    const host = uploadHost(baseCreateMemeContext)
    const { earlier, later, started } = startTwoImages(host)

    expect(host.events).toEqual(started)

    uploadGates[0]?.resolve('https://files/a.png')
    await earlier

    expect(host.events).toEqual(started)
    expect(kinds(host.events, 'SET_IMAGE_URL')).toEqual([])
    expect(kinds(host.events, 'DONE')).toEqual([])
    expect(kinds(host.events, 'FAIL')).toEqual([])

    uploadGates[1]?.resolve('https://files/b.png')
    await later

    expect(host.events).toEqual(imageApplied(started, 'https://files/b.png', 'b.png'))
    expect(host.getOwner).not.toHaveBeenCalled()
  })

  it('drops a stale image rejection and still finishes the later image', async () => {
    const host = uploadHost(baseCreateMemeContext)
    const { earlier, later, started } = startTwoImages(host)
    const abort = new Error('The operation was aborted.')
    abort.name = 'AbortError'

    uploadGates[0]?.reject(abort)
    await earlier

    expect(host.events).toEqual(started)
    expect(kinds(host.events, 'FAIL')).toEqual([])
    expect(kinds(host.events, 'DONE')).toEqual([])

    uploadGates[1]?.resolve('https://files/b.png')
    await later

    expect(host.events).toEqual(imageApplied(started, 'https://files/b.png', 'b.png'))
    expect(host.getOwner).not.toHaveBeenCalled()
  })

  it('drops a stale video rejection without extracting a poster', async () => {
    const host = uploadHost(noPosterYet())
    const earlier = onVideoFile(host, picked('clip.mp4', 40))
    const later = onImageFile(host, picked('still.png', 16))

    uploadGates[0]?.reject(new Error('stale video'))
    await earlier

    expect(extractPoster).not.toHaveBeenCalled()
    expect(kinds(host.events, 'FAIL')).toEqual([])
    expect(kinds(host.events, 'DONE')).toEqual([])

    uploadGates[1]?.resolve('https://files/still.png')
    await later

    expect(host.events).toEqual([
      { type: 'SET_FILE_NAME', kind: 'video', name: 'clip.mp4' },
      { type: 'SUBMIT', busy: createMemeCopy.busy.uploadingVideo },
      { type: 'SET_FILE_NAME', kind: 'image', name: 'still.png' },
      { type: 'SUBMIT', busy: createMemeCopy.busy.uploadingImage },
      { type: 'SET_IMAGE_URL', imageUrl: 'https://files/still.png', fileName: 'still.png' },
      { type: 'DONE' },
    ])
    expect(extractPoster).not.toHaveBeenCalled()
    expect(host.getOwner).not.toHaveBeenCalled()
  })

  it('fails a current image rejection with uploadFailed and does not set a url', async () => {
    const host = uploadHost(baseCreateMemeContext)
    const pending = onImageFile(host, picked('a.png', 12))

    uploadGates[0]?.reject(new Error('offline'))
    await pending

    expect(host.events).toEqual([
      { type: 'SET_FILE_NAME', kind: 'image', name: 'a.png' },
      { type: 'SUBMIT', busy: createMemeCopy.busy.uploadingImage },
      { type: 'FAIL', err: createMemeCopy.errors.uploadFailed },
    ])
    expect(kinds(host.events, 'SET_IMAGE_URL')).toEqual([])
    expect(host.getOwner).not.toHaveBeenCalled()
  })

  it('drops a video put that resolves after a newer image pick', async () => {
    const host = uploadHost(noPosterYet())
    const video = onVideoFile(host, picked('clip.mp4', 40))
    const image = onImageFile(host, picked('still.png', 16))

    uploadGates[0]?.resolve('https://files/clip.mp4')
    await settle()
    if (posterGates.length > 0) posterGates[0]?.reject(new Error('poster is not current'))
    await video

    expect(extractPoster).not.toHaveBeenCalled()
    expect(kinds(host.events, 'SET_VIDEO_URL')).toEqual([])
    expect(kinds(host.events, 'SET_IMAGE_URL')).toEqual([])
    expect(kinds(host.events, 'DONE')).toEqual([])

    uploadGates[1]?.resolve('https://files/still.png')
    await image

    expect(kinds(host.events, 'SET_IMAGE_URL')).toEqual([
      { type: 'SET_IMAGE_URL', imageUrl: 'https://files/still.png', fileName: 'still.png' },
    ])
    expect(kinds(host.events, 'DONE')).toEqual([{ type: 'DONE' }])
    expect(host.getOwner).not.toHaveBeenCalled()
  })

  it('drops a poster put when a newer image starts while imageUrl is still empty', async () => {
    const host = uploadHost(noPosterYet())
    const clip = picked('clip.mp4', 80)
    const still = picked('still.png', 16)
    const video = onVideoFile(host, clip)

    uploadGates[0]?.resolve('https://files/clip.mp4')
    await settle()

    expect(host.events).toEqual([
      { type: 'SET_FILE_NAME', kind: 'video', name: 'clip.mp4' },
      { type: 'SUBMIT', busy: createMemeCopy.busy.uploadingVideo },
      { type: 'SET_VIDEO_URL', videoUrl: 'https://files/clip.mp4', fileName: 'clip.mp4' },
      { type: 'BUSY', busy: createMemeCopy.busy.extractingPoster },
    ])
    expect(extractPoster).toHaveBeenCalledWith(clip)
    expect(posterGates).toHaveLength(1)
    expect(uploadGates).toHaveLength(1)

    const image = onImageFile(host, still)
    expect(host.getCtx().imageUrl).toBe('')
    expect(uploadGates).toHaveLength(2)

    const poster = new Blob(['frame'], { type: 'image/png' })
    posterGates[0]?.resolve(poster)
    await settle()
    const posterPuts = uploadCreateMemeFile.mock.calls.filter((call) => call[1] === 'image/png')
    if (posterPuts.length > 0) uploadGates[2]?.reject(new Error('poster put is not current'))
    await video

    expect(posterPuts).toEqual([])
    expect(uploadCreateMemeFile).toHaveBeenCalledTimes(2)
    expect(kinds(host.events, 'SET_IMAGE_URL')).toEqual([])
    expect(kinds(host.events, 'DONE')).toEqual([])
    expect(host.getCtx().imageUrl).toBe('')

    uploadGates[1]?.resolve('https://files/still.png')
    await image

    expect(host.events).toEqual([
      { type: 'SET_FILE_NAME', kind: 'video', name: 'clip.mp4' },
      { type: 'SUBMIT', busy: createMemeCopy.busy.uploadingVideo },
      { type: 'SET_VIDEO_URL', videoUrl: 'https://files/clip.mp4', fileName: 'clip.mp4' },
      { type: 'BUSY', busy: createMemeCopy.busy.extractingPoster },
      { type: 'SET_FILE_NAME', kind: 'image', name: 'still.png' },
      { type: 'SUBMIT', busy: createMemeCopy.busy.uploadingImage },
      { type: 'SET_IMAGE_URL', imageUrl: 'https://files/still.png', fileName: 'still.png' },
      { type: 'DONE' },
    ])
    expect(uploadCreateMemeFile).toHaveBeenCalledTimes(2)
    expect(uploadCreateMemeFile).not.toHaveBeenCalledWith(poster, 'image/png')
    expect(host.getCtx().imageUrl).toBe('')
    expect(host.getOwner).not.toHaveBeenCalled()
  })

  it('does not retire an in-flight image when a later pick is over cap', async () => {
    const host = uploadHost(baseCreateMemeContext)
    const kept = picked('ok.png', 20)
    const oversize = picked('big.png', MAX_IMAGE_BYTES + 1)
    const pending = onImageFile(host, kept)
    await onImageFile(host, oversize)

    expect(uploadCreateMemeFile).toHaveBeenCalledTimes(1)
    expect(uploadCreateMemeFile).toHaveBeenCalledWith(kept)
    expect(host.events).toEqual([
      { type: 'SET_FILE_NAME', kind: 'image', name: 'ok.png' },
      { type: 'SUBMIT', busy: createMemeCopy.busy.uploadingImage },
      { type: 'SET_FILE_NAME', kind: 'image', name: 'big.png' },
      { type: 'FAIL', err: overCapMessage('image', oversize.size, MAX_IMAGE_BYTES) },
    ])

    const rejectedOversize = [...host.events]
    uploadGates[0]?.resolve('https://files/ok.png')
    await pending

    expect(host.events).toEqual([
      ...rejectedOversize,
      { type: 'SET_IMAGE_URL', imageUrl: 'https://files/ok.png', fileName: 'ok.png' },
      { type: 'DONE' },
    ])
    expect(host.getOwner).not.toHaveBeenCalled()
  })
})
