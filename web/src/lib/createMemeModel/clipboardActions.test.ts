import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemeCopy } from '../../copy/createMeme'
import type { CreateMemeEvent } from '../../stores/createMemeMachine'
import type { CreateMemeActionHost } from './actionHost'
import { onClipboardPaste, onPasteCapture } from './clipboardActions'
import { baseCreateMemeContext } from './testContext'

const { uploadCreateMemeFile, extractPoster, readClipboardImage } = vi.hoisted(() => ({
  uploadCreateMemeFile: vi.fn(),
  extractPoster: vi.fn(),
  readClipboardImage: vi.fn(),
}))

vi.mock('../createMemeUpload', () => ({ uploadCreateMemeFile }))
vi.mock('../extractPoster', () => ({ extractPoster }))
vi.mock('../clipboardImage', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  readClipboardImage,
}))

function pasted(name: string, type: string): File {
  return { name, size: 12, type } as File
}

function clipboardHost(): CreateMemeActionHost & { events: CreateMemeEvent[] } {
  const events: CreateMemeEvent[] = []
  const record = (event: CreateMemeEvent) => {
    events.push(event)
  }
  return {
    events,
    getCtx: () => baseCreateMemeContext,
    send: record,
    beginBusy: (busy) => {
      record({ type: 'SUBMIT', busy })
    },
    settleBusy: record,
    pollVideo: () => Promise.reject(new Error('clipboard does not poll video')),
    getOwner: vi.fn(() => ({ active: true })),
  }
}

/** The DataTransfer a paste event carries, reduced to the two members the capture reads. */
function transfer(files: File[], types: string[] = ['Files']): DataTransfer {
  return { files, types } as unknown as DataTransfer
}

describe('create-meme clipboard paste', () => {
  beforeEach(() => {
    uploadCreateMemeFile.mockReset()
    uploadCreateMemeFile.mockResolvedValue('https://files/pasted.png')
    readClipboardImage.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('uploads the clipboard image through the same path a picked file takes', async () => {
    const host = clipboardHost()
    const file = pasted('pasted-image.png', 'image/png')
    readClipboardImage.mockResolvedValue(file)

    await onClipboardPaste(host)

    expect(uploadCreateMemeFile).toHaveBeenCalledWith(file)
    expect(host.events).toEqual([
      { type: 'SET_FILE_NAME', kind: 'image', name: 'pasted-image.png' },
      { type: 'SUBMIT', busy: createMemeCopy.busy.uploadingImage },
      {
        type: 'SET_IMAGE_URL',
        imageUrl: 'https://files/pasted.png',
        fileName: 'pasted-image.png',
      },
      { type: 'DONE' },
    ])
  })

  it('reports an empty clipboard in place, without a busy flash', async () => {
    const host = clipboardHost()
    readClipboardImage.mockResolvedValue(null)

    await onClipboardPaste(host)

    expect(uploadCreateMemeFile).not.toHaveBeenCalled()
    expect(host.events).toEqual([{ type: 'FAIL', err: createMemeCopy.errors.clipboardEmpty }])
  })

  it('reports a refused read as its own error', async () => {
    const host = clipboardHost()
    readClipboardImage.mockRejectedValue(new DOMException('denied', 'NotAllowedError'))

    await onClipboardPaste(host)

    expect(uploadCreateMemeFile).not.toHaveBeenCalled()
    expect(host.events).toEqual([{ type: 'FAIL', err: createMemeCopy.errors.clipboardReadFailed }])
  })

  it('routes a pasted image to the image well and consumes the event', () => {
    const host = clipboardHost()
    const file = pasted('screenshot.png', 'image/png')

    expect(onPasteCapture(host, transfer([file]), false)).toBe(true)

    expect(uploadCreateMemeFile).toHaveBeenCalledWith(file)
    expect(host.events[0]).toEqual({ type: 'SET_FILE_NAME', kind: 'image', name: 'screenshot.png' })
  })

  it('routes a pasted video file to the video well', () => {
    const host = clipboardHost()
    const file = pasted('clip.mp4', 'video/mp4')

    expect(onPasteCapture(host, transfer([file]), false)).toBe(true)

    expect(host.events[0]).toEqual({ type: 'SET_FILE_NAME', kind: 'video', name: 'clip.mp4' })
  })

  it('starts only the image when a paste somehow carries both wells', () => {
    const host = clipboardHost()
    const image = pasted('still.png', 'image/png')
    const video = pasted('clip.mp4', 'video/mp4')

    expect(onPasteCapture(host, transfer([video, image]), false)).toBe(true)

    expect(uploadCreateMemeFile).toHaveBeenCalledTimes(1)
    expect(uploadCreateMemeFile).toHaveBeenCalledWith(image)
  })

  it('leaves a text paste aimed at a text field alone, even with an image along', () => {
    const host = clipboardHost()
    const file = pasted('selection.png', 'image/png')

    expect(onPasteCapture(host, transfer([file], ['text/plain', 'Files']), true)).toBe(false)

    expect(uploadCreateMemeFile).not.toHaveBeenCalled()
    expect(host.events).toEqual([])
  })

  it('still takes an image-only paste landing on a text field', () => {
    const host = clipboardHost()
    const file = pasted('screenshot.png', 'image/png')

    expect(onPasteCapture(host, transfer([file]), true)).toBe(true)

    expect(uploadCreateMemeFile).toHaveBeenCalledWith(file)
  })

  it('ignores a paste with no media file and a missing DataTransfer', () => {
    const host = clipboardHost()

    expect(onPasteCapture(host, transfer([], ['text/plain']), false)).toBe(false)
    expect(onPasteCapture(host, null, false)).toBe(false)

    expect(uploadCreateMemeFile).not.toHaveBeenCalled()
    expect(host.events).toEqual([])
  })
})
