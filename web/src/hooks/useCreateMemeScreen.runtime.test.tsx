import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemeCopy as copy } from '../copy/createMeme'
import { createMemeScreenHost } from '../test/createMemeScreenHost'
import { bodyOf, deferred, pathOf, settle, stubClipboardWrite } from '../test/runtime'

const screen = createMemeScreenHost('mint')
let host: HTMLDivElement
const { renderAt, button, click, change } = screen

function stubImageFetch(image: { promise: Promise<Response> }) {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input) => {
      if (pathOf(input) === '/api/aigen/image') return image.promise
      throw new Error(`Unexpected request: ${pathOf(input)}`)
    }),
  )
}

beforeEach(() => {
  host = screen.host
})

describe('CreateMemeRoute settling requests', () => {
  it('locks the mode row while a render runs and keeps the artwork across a later switch', async () => {
    const image = deferred<Response>()
    stubImageFetch(image)
    await renderAt()

    await change(host.querySelector<HTMLInputElement>('#create-title')!, 'pending image')
    await change(
      host.querySelector<HTMLTextAreaElement>(
        `textarea[placeholder^="${copy.generate.promptPlaceholder}"]`,
      )!,
      'draw it',
    )
    await click(button(copy.generate.renderImage))
    expect(button(copy.modes.upload).disabled).toBe(true)
    await act(async () => {
      image.resolve(Response.json({ imageUrl: '/finished.png' }))
      await settle()
    })
    await click(button(copy.modes.upload))

    expect(button(copy.modes.upload).getAttribute('aria-pressed')).toBe('true')
    expect(
      host.querySelector<HTMLImageElement>('img[data-slot="meme-art"]')?.getAttribute('src'),
    ).toBe('/finished.png')
    expect(host.querySelector('[data-slot="form-grid"]')?.getAttribute('aria-busy')).toBe('false')
    expect(button(copy.form.mint).disabled).toBe(false)
    expect(host.textContent).not.toContain(copy.busy.generatingImage)
  })

  it('clears busy, shows the error with a next step, and permits retry after a mode switch', async () => {
    const image = deferred<Response>()
    stubImageFetch(image)
    await renderAt()

    await change(
      host.querySelector<HTMLTextAreaElement>(
        `textarea[placeholder^="${copy.generate.promptPlaceholder}"]`,
      )!,
      'draw it',
    )
    await click(button(copy.generate.renderImage))
    await act(async () => {
      image.resolve(Response.json({ error: 'credits exhausted' }, { status: 402 }))
      await settle()
    })

    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      copy.errors.creditsExhausted,
    )
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      copy.preview.nextStep.credits,
    )
    expect(host.querySelector('[data-slot="form-grid"]')?.getAttribute('aria-busy')).toBe('false')
    expect(host.textContent).not.toContain(copy.busy.generatingImage)
    await click(button(copy.modes.upload))
    await click(button(copy.modes.generate))
    expect(button(copy.modes.generate).getAttribute('aria-pressed')).toBe('true')
    expect(button(copy.generate.renderImage).disabled).toBe(false)
  })

  it('maps a 500 generate failure onto copy.errors.generationFailed, not the POST template', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((input) => {
        if (pathOf(input) === '/api/aigen/image') {
          return Promise.resolve(new Response('', { status: 500 }))
        }
        throw new Error(`Unexpected request: ${pathOf(input)}`)
      }),
    )
    await renderAt()

    await change(
      host.querySelector<HTMLTextAreaElement>('textarea[placeholder^="a capybara"]')!,
      'draw it',
    )
    await click(button('Render the image'))
    for (let attempt = 0; attempt < 20 && !host.querySelector('[role="alert"]'); attempt += 1) {
      await act(async () => {
        await settle()
      })
    }

    const alert = host.querySelector('[role="alert"]')?.textContent ?? ''
    expect(alert).toContain(copy.errors.generationFailed)
    expect(alert).not.toContain('POST /api/aigen/image failed (500)')
  })

  it('holds the minted card with its share link instead of navigating away', async () => {
    const mint = deferred<Response>()
    const mintBodies: Record<string, unknown>[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((input, init) => {
        const path = pathOf(input)
        if (path === '/api/aigen/image')
          return Promise.resolve(Response.json({ imageUrl: '/generated.png' }))
        if (path === '/api/memes') {
          mintBodies.push(bodyOf(init))
          return mint.promise
        }
        throw new Error(`Unexpected request: ${path}`)
      }),
    )
    await renderAt()

    await change(host.querySelector<HTMLInputElement>('#create-title')!, 'original title')
    await change(
      host.querySelector<HTMLTextAreaElement>(
        `textarea[placeholder^="${copy.generate.promptPlaceholder}"]`,
      )!,
      'draw it',
    )
    await click(button(copy.generate.renderImage))
    await click(button(copy.form.mint))
    expect(button(copy.modes.upload).disabled).toBe(true)
    await act(async () => {
      mint.resolve(Response.json({ meme: { id: 'minted-original' } }))
      await settle()
    })

    expect(mintBodies).toEqual([
      expect.objectContaining({
        title: 'original title',
        imageUrl: '/generated.png',
        mediaType: 'image',
        videoUrl: null,
        source: null,
      }),
    ])
    expect(host.textContent).toContain('Minted')
    expect(host.querySelector<HTMLInputElement>('input[readonly]')?.value).toBe(
      `${window.location.origin}/m/minted-original`,
    )
    expect(host.querySelector('output[aria-label="Current route"]')?.textContent).toBe(
      '/binder/new',
    )

    const open = [...host.querySelectorAll('a')].find(
      (a) => a.textContent === copy.form.success.openCard,
    )!
    await click(open)
    expect(host.querySelector('output[aria-label="Current route"]')?.textContent).toBe(
      '/m/minted-original',
    )
  })

  it('paints copyFailed when the share-link write rejects', async () => {
    const previous = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    try {
      await mintOriginalShare()
      stubClipboardWrite(async () => {
        throw new Error('denied')
      })
      await click(button(copy.form.success.copyLink))
      expectShareCopyFailed()
    } finally {
      restoreClipboard(previous)
    }
  })

  it('paints copyFailed when navigator.clipboard is missing', async () => {
    const previous = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    try {
      await mintOriginalShare()
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        writable: true,
        value: undefined,
      })
      await click(button(copy.form.success.copyLink))
      expectShareCopyFailed()
    } finally {
      restoreClipboard(previous)
    }
  })

  it('paints copyFailed when clipboard has no writeText', async () => {
    const previous = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    try {
      await mintOriginalShare()
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        writable: true,
        value: {},
      })
      await click(button(copy.form.success.copyLink))
      expectShareCopyFailed()
    } finally {
      restoreClipboard(previous)
    }
  })

  it('copies the share link on the clipboard receiver', async () => {
    const previous = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    try {
      await mintOriginalShare()
      const writeText = vi.fn().mockResolvedValue(undefined)
      stubClipboardWrite(writeText)
      await click(button(copy.form.success.copyLink))
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/m/minted-original`)
      expect(host.querySelector('[role="status"]')?.textContent?.trim()).toBe(
        copy.form.success.copied,
      )
      expect(button(copy.form.copied)).toBeTruthy()
      expect(
        [...host.querySelectorAll('button')].some((candidate) =>
          candidate.textContent?.includes(copy.form.success.copyFailed),
        ),
      ).toBe(false)
    } finally {
      restoreClipboard(previous)
    }
  })
})

const mintedShareUrl = `${window.location.origin}/m/minted-original`

function restoreClipboard(previous: PropertyDescriptor | undefined): void {
  if (previous) Object.defineProperty(navigator, 'clipboard', previous)
  else Reflect.deleteProperty(navigator, 'clipboard')
}

async function mintOriginalShare(): Promise<void> {
  const mint = deferred<Response>()
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input) => {
      const path = pathOf(input)
      if (path === '/api/aigen/image')
        return Promise.resolve(Response.json({ imageUrl: '/generated.png' }))
      if (path === '/api/memes') return mint.promise
      throw new Error(`Unexpected request: ${path}`)
    }),
  )
  await renderAt()

  await change(host.querySelector<HTMLInputElement>('#create-title')!, 'original title')
  await change(
    host.querySelector<HTMLTextAreaElement>(
      `textarea[placeholder^="${copy.generate.promptPlaceholder}"]`,
    )!,
    'draw it',
  )
  await click(button(copy.generate.renderImage))
  await click(button(copy.form.mint))
  await act(async () => {
    mint.resolve(Response.json({ meme: { id: 'minted-original' } }))
    await settle()
  })
  expect(button(copy.form.success.copyLink)).toBeTruthy()
  expect(host.querySelector('output[aria-label="Current route"]')?.textContent).toBe('/binder/new')
}

function expectShareCopyFailed(): void {
  expect(button(copy.form.success.copyFailed)).toBeTruthy()
  const status = host.querySelector('[role="status"]')?.textContent?.trim()
  expect(status).toBe(copy.form.success.copyFailed)
  expect(status).not.toContain(copy.form.success.minted)
  expect(status).not.toContain(copy.form.success.copied)
  expect(host.textContent).not.toContain('denied')
  expect(host.textContent).not.toContain(copy.errors.mintFailed)
  expect(host.querySelector<HTMLInputElement>('input[readonly]')?.value).toBe(mintedShareUrl)
  expect(host.querySelector('output[aria-label="Current route"]')?.textContent).toBe('/binder/new')
  expect(
    [...host.querySelectorAll('button')].some((candidate) =>
      candidate.textContent?.includes(copy.form.copied),
    ),
  ).toBe(false)
}
