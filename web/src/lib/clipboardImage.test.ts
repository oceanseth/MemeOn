import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemeCopy } from '../copy/createMeme'
import { probeClipboardImage, readClipboardImage, supportsClipboardRead } from './clipboardImage'

interface ClipboardStub {
  clipboard?: { read?: ReturnType<typeof vi.fn> }
  permissions?: { query: ReturnType<typeof vi.fn> }
}

function stubNavigator(stub: ClipboardStub): void {
  vi.stubGlobal('navigator', stub)
}

function clipboardItem(types: string[], blobs: Record<string, Blob> = {}): ClipboardItem {
  return {
    types,
    getType: (type: string) => Promise.resolve(blobs[type] ?? new Blob([], { type })),
  } as unknown as ClipboardItem
}

const granted = () => vi.fn().mockResolvedValue({ state: 'granted' })

describe('clipboardImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('supports the clipboard route only where the async reader exists', () => {
    /* jsdom ships no navigator.clipboard, which is the Firefox-ESR shape */
    expect(supportsClipboardRead()).toBe(false)
    stubNavigator({ clipboard: { read: vi.fn() } })
    expect(supportsClipboardRead()).toBe(true)
    stubNavigator({ clipboard: {} })
    expect(supportsClipboardRead()).toBe(false)
  })

  it('probes silently: no read — and no prompt — unless the permission is already granted', async () => {
    const read = vi.fn().mockResolvedValue([clipboardItem(['image/png'])])
    stubNavigator({
      clipboard: { read },
      permissions: { query: vi.fn().mockResolvedValue({ state: 'prompt' }) },
    })
    expect(await probeClipboardImage()).toBe(false)
    expect(read).not.toHaveBeenCalled()

    /* Safari and Firefox throw on the descriptor itself: same quiet no */
    stubNavigator({
      clipboard: { read },
      permissions: { query: vi.fn().mockRejectedValue(new TypeError('unsupported')) },
    })
    expect(await probeClipboardImage()).toBe(false)
    expect(read).not.toHaveBeenCalled()
  })

  it('sees an image behind a granted permission, and nothing where there is none', async () => {
    const read = vi
      .fn()
      .mockResolvedValue([clipboardItem(['text/plain']), clipboardItem(['image/png'])])
    stubNavigator({ clipboard: { read }, permissions: { query: granted() } })
    expect(await probeClipboardImage()).toBe(true)

    read.mockResolvedValue([clipboardItem(['text/plain'])])
    expect(await probeClipboardImage()).toBe(false)

    /* an unfocused document rejects the read: a quiet no, never a thrown probe */
    read.mockRejectedValue(new DOMException('not focused', 'NotAllowedError'))
    expect(await probeClipboardImage()).toBe(false)
  })

  it('reads the image off as a named File the upload path already takes', async () => {
    const png = new Blob(['art'], { type: 'image/png' })
    const read = vi
      .fn()
      .mockResolvedValue([clipboardItem(['text/html', 'image/png'], { 'image/png': png })])
    stubNavigator({ clipboard: { read } })

    const file = await readClipboardImage()
    expect(file?.name).toBe(createMemeCopy.upload.pastedFileName('png'))
    expect(file?.type).toBe('image/png')

    read.mockResolvedValue([clipboardItem(['image/jpeg'])])
    expect((await readClipboardImage())?.name).toBe(createMemeCopy.upload.pastedFileName('jpg'))

    read.mockResolvedValue([clipboardItem(['text/plain'])])
    expect(await readClipboardImage()).toBe(null)
  })
})
