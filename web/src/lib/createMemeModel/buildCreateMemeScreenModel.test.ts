import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent } from 'react'
import { createActor } from 'xstate'
import { describe, expect, it, vi } from 'vitest'
import { createMemeCopy as copy } from '../../copy/createMeme'
import { createMemeMachine, type CreateMemeContext } from '../../stores/createMemeMachine'
import type { GiphyResult } from '../types'
import { buildCreateMemeScreenModel } from './buildCreateMemeScreenModel'
import { boundTags, countTags, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, overCapMessage } from './shared'
import type { CreateMemeScreenActions } from './types'

const giphyResult: GiphyResult = {
  id: 'cat-1',
  title: 'Keyboard cat',
  stillUrl: '/cat-still.png',
  gifUrl: '/cat.gif',
  mp4Url: null,
  author: 'catlord',
  url: 'https://giphy.com/gifs/cat-1',
}

const baseContext: CreateMemeContext = createActor(createMemeMachine, {
  input: { remixId: null },
}).getSnapshot().context

function actions(): CreateMemeScreenActions {
  return {
    selectMode: vi.fn(),
    setTitle: vi.fn(),
    setTags: vi.fn(),
    setPrompt: vi.fn(),
    setRemixOutput: vi.fn(),
    setVideoMode: vi.fn(),
    setMotionPrompt: vi.fn(),
    setGiphyQuery: vi.fn(),
    searchGiphy: vi.fn(),
    pickGiphy: vi.fn(),
    setUrl: vi.fn(),
    resolvePageUrl: vi.fn(),
    applyGiphyEdit: vi.fn(),
    applyUrlEdit: vi.fn(),
    uploadImage: vi.fn(),
    uploadVideo: vi.fn(),
    remix: vi.fn(),
    animateEdited: vi.fn(),
    generate: vi.fn(),
    mint: vi.fn(),
    copyShareLink: vi.fn(),
  }
}

function inputChange(value: string) {
  return { currentTarget: { value } } as ChangeEvent<HTMLInputElement>
}

function textareaChange(value: string) {
  return { currentTarget: { value } } as ChangeEvent<HTMLTextAreaElement>
}

function keyEvent(key: string) {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent<HTMLElement>
}

function clickEvent() {
  return {} as MouseEvent<HTMLButtonElement>
}

describe('buildCreateMemeScreenModel', () => {
  it('decodes mode, bounded title, text, and select events into domain actions', () => {
    const calls = actions()
    const model = buildCreateMemeScreenModel(
      'remix',
      {
        ...baseContext,
        mode: 'remix',
        remixId: 'source-1',
        prompt: 'current prompt',
      },
      calls,
    )

    /* the chip's chrome is the screen's business: the model names the state and the label */
    const selectedMode = model.getModeButtonProps('remix')
    expect(selectedMode).toMatchObject({
      selected: true,
      label: copy.modes.remix,
      buttonProps: { 'aria-pressed': true },
    })
    expect(model.pageTitle).toBe(copy.page.title)
    expect(model.remixOutputSelectProps.items).toEqual([
      { value: 'image', label: copy.remix.outputOptions.image },
      { value: 'video', label: copy.remix.outputOptions.video },
    ])
    expect(selectedMode.buttonProps).not.toHaveProperty('className')
    selectedMode.buttonProps.onClick?.(clickEvent())
    expect(calls.selectMode).toHaveBeenCalledWith('remix')
    expect(model.getModeButtonProps('generate')).toMatchObject({
      selected: false,
      buttonProps: { 'aria-pressed': false },
    })

    model.titleInputProps.onChange?.(inputChange('12345678901234567890overflow'))
    model.tagsInputProps.onChange?.(inputChange('cats, chaos'))
    model.remixPromptTextareaProps.onChange?.(textareaChange('make it blue'))
    model.giphyPromptTextareaProps.onChange?.(textareaChange('make it loop'))
    model.urlPromptTextareaProps.onChange?.(textareaChange('make it late'))
    model.generatePromptTextareaProps.onChange?.(textareaChange('draw a cat'))
    model.motionPromptTextareaProps.onChange?.(textareaChange('short loop'))
    expect(calls.setTitle).toHaveBeenCalledWith('12345678901234567890')
    /* graphemes, not UTF-16 units: a combining cluster is never cut in half (a + two accents) */
    const cluster = 'a\u0301\u0301'
    model.titleInputProps.onChange?.(inputChange(cluster.repeat(25)))
    expect(calls.setTitle).toHaveBeenLastCalledWith(cluster.repeat(20))
    model.tagsInputProps.onChange?.(inputChange('a,b,c,d,e,f,g'))
    expect(calls.setTags).toHaveBeenLastCalledWith('a,b,c,d,e')
    expect(calls.setTags).toHaveBeenCalledWith('cats, chaos')
    const fiveLongTags =
      'photosynthesis, extraterrestrial, incomprehensible, procrastination, internationalization'
    expect(fiveLongTags.length).toBeGreaterThan(80)
    expect(model.tagsInputProps.maxLength).toBeUndefined()
    model.tagsInputProps.onChange?.(inputChange(fiveLongTags))
    expect(calls.setTags).toHaveBeenLastCalledWith(fiveLongTags)
    expect(calls.setPrompt).toHaveBeenNthCalledWith(1, 'make it blue')
    expect(calls.setPrompt).toHaveBeenNthCalledWith(2, 'make it loop')
    expect(calls.setPrompt).toHaveBeenNthCalledWith(3, 'make it late')
    expect(calls.setPrompt).toHaveBeenNthCalledWith(4, 'draw a cat')
    expect(calls.setMotionPrompt).toHaveBeenCalledWith('short loop')

    /* the pickers take a value, not an event: a cleared or unknown one never reaches the machine */
    model.remixOutputSelectProps.onValueChange(null)
    model.remixOutputSelectProps.onValueChange('invalid')
    model.remixOutputSelectProps.onValueChange('video')
    model.videoModeSelectProps.onValueChange('invalid')
    model.videoModeSelectProps.onValueChange('restyle')
    expect(calls.setRemixOutput).toHaveBeenCalledTimes(1)
    expect(calls.setRemixOutput).toHaveBeenCalledWith('video')
    expect(calls.setVideoMode).toHaveBeenCalledTimes(1)
    expect(calls.setVideoMode).toHaveBeenCalledWith('restyle')
  })

  it('owns Giphy category, query, Enter, button, and keyboard-pick behavior', () => {
    const calls = actions()
    const model = buildCreateMemeScreenModel(
      'giphy',
      {
        ...baseContext,
        mode: 'giphy',
        giphyQuery: 'keyboard cat',
        giphyResults: [giphyResult],
      },
      calls,
    )

    expect(model.giphyPick).toBeNull()
    /* results are on screen, so the panel's status line only has to reach a screen reader */
    expect(model.giphyStatusHidden).toBe(true)

    expect(model.giphyCategorySelectProps.value).toBe('')
    model.giphyCategorySelectProps.onValueChange('')
    model.giphyCategorySelectProps.onValueChange('Animals')
    expect(calls.searchGiphy).toHaveBeenCalledTimes(1)
    expect(calls.searchGiphy).toHaveBeenCalledWith('Animals')

    model.giphyQueryInputProps.onChange?.(inputChange('new query'))
    expect(calls.setGiphyQuery).toHaveBeenCalledWith('new query')
    const ignored = keyEvent('Escape')
    model.giphyQueryInputProps.onKeyDown?.(ignored as KeyboardEvent<HTMLInputElement>)
    expect(ignored.preventDefault).not.toHaveBeenCalled()
    const enter = keyEvent('Enter')
    model.giphyQueryInputProps.onKeyDown?.(enter as KeyboardEvent<HTMLInputElement>)
    expect(enter.preventDefault).toHaveBeenCalledOnce()
    expect(calls.searchGiphy).toHaveBeenLastCalledWith('keyboard cat')
    model.giphySearchButtonProps.onClick?.(clickEvent())
    expect(calls.searchGiphy).toHaveBeenLastCalledWith('keyboard cat')

    const cell = model.getGiphyResultProps(giphyResult)
    /* unpicked cells are stills: fifty looping originals is a payload and a 2.2.2 failure */
    expect(cell.imageProps).toMatchObject({
      src: '/cat-still.png',
      alt: 'Keyboard cat',
      loading: 'lazy',
      decoding: 'async',
    })
    expect(cell.buttonProps).toMatchObject({
      type: 'button',
      'aria-pressed': false,
    })
    expect(cell.buttonProps).not.toHaveProperty('className')
    expect(cell.picked).toBe(false)
    cell.buttonProps.onClick?.(clickEvent())
    expect(calls.pickGiphy).toHaveBeenCalledWith(giphyResult)

    const selected = buildCreateMemeScreenModel(
      'giphy',
      {
        ...baseContext,
        mode: 'giphy',
        giphyPick: giphyResult,
      },
      calls,
    )
    expect(selected.getGiphyResultProps(giphyResult)).toMatchObject({
      picked: true,
      buttonProps: { 'aria-pressed': true },
    })
    expect(selected.getGiphyResultProps(giphyResult).imageProps.src).toBe('/cat.gif')
    expect(selected.giphyPick).toEqual({
      title: 'Keyboard cat',
      authorLabel: copy.giphy.authorLabel('catlord'),
    })

    const missingAuthor = buildCreateMemeScreenModel(
      'giphy',
      {
        ...baseContext,
        mode: 'giphy',
        giphyPick: { ...giphyResult, author: null },
      },
      calls,
    )
    expect(missingAuthor.giphyPick).toEqual({
      title: 'Keyboard cat',
      authorLabel: null,
    })

    const blankAuthor = buildCreateMemeScreenModel(
      'giphy',
      {
        ...baseContext,
        mode: 'giphy',
        giphyPick: { ...giphyResult, author: '' },
      },
      calls,
    )
    expect(blankAuthor.giphyPick).toEqual({
      title: 'Keyboard cat',
      authorLabel: null,
    })
  })

  it('keeps a typed URL out of the artwork until it resolves', () => {
    const calls = actions()
    const model = buildCreateMemeScreenModel('url', { ...baseContext, mode: 'url' }, calls)

    /* an unresolved draft is not artwork, so Mint stays shut and Fetch stays the way forward */
    expect(model.fetchUrlButtonProps.disabled).toBe(true)
    expect(model.mintButtonProps.disabled).toBe(true)
    const typed = buildCreateMemeScreenModel(
      'url',
      {
        ...baseContext,
        mode: 'url',
        title: 'ready',
        urlDraft: 'https://example.com/post',
      },
      calls,
    )
    expect(typed.urlInputProps.value).toBe('https://example.com/post')
    expect(typed.fetchUrlButtonProps.disabled).toBe(false)
    expect(typed.mintButtonProps.disabled).toBe(true)
    typed.fetchUrlButtonProps.onClick?.(clickEvent())
    expect(calls.resolvePageUrl).toHaveBeenCalledTimes(1)
    calls.resolvePageUrl = vi.fn()

    model.urlInputProps.onChange?.(inputChange('https://example.com/post'))
    expect(calls.setUrl).toHaveBeenCalledWith('https://example.com/post')
    model.urlInputProps.onBlur?.({} as FocusEvent<HTMLInputElement>)
    expect(calls.resolvePageUrl).toHaveBeenCalledTimes(1)
    model.urlInputProps.onKeyDown?.(keyEvent('Escape') as KeyboardEvent<HTMLInputElement>)
    expect(calls.resolvePageUrl).toHaveBeenCalledTimes(1)
    const enter = keyEvent('Enter')
    model.urlInputProps.onKeyDown?.(enter as KeyboardEvent<HTMLInputElement>)
    expect(enter.preventDefault).toHaveBeenCalledOnce()
    expect(calls.resolvePageUrl).toHaveBeenCalledTimes(2)
  })

  it("keeps upload MIME contracts and spells the picker in the app's own words", () => {
    const calls = actions()
    const model = buildCreateMemeScreenModel('upload', { ...baseContext, mode: 'upload' }, calls)
    const image = { name: 'cat.png', type: 'image/png', size: 8 } as File
    const video = { name: 'cat.mp4', type: 'video/mp4', size: 50 } as File

    expect(model.imageFileDropProps.accept).toBe('image/png,image/jpeg,image/gif,image/webp')
    expect(model.videoFileDropProps.accept).toBe('video/mp4,video/quicktime,video/webm')
    expect(model.imageFileDropProps.disabled).toBe(false)
    expect(model.videoFileDropProps.disabled).toBe(false)
    // the words the browser used to write are the deck's now
    expect(model.imageFileDropProps.chooseLabel).toBe('Choose an image')
    expect(model.videoFileDropProps.chooseLabel).toBe('Choose a video')
    expect(model.imageFileDropProps.emptyLabel).toBe('or drop one here')
    model.imageFileDropProps.onFile(image)
    model.videoFileDropProps.onFile(video)
    expect(calls.uploadImage).toHaveBeenCalledWith(image)
    expect(calls.uploadVideo).toHaveBeenCalledWith(video)
  })

  it('derives disabled actions and live-region ARIA from prompt, media, and busy state', () => {
    const readyActions = actions()
    const ready = buildCreateMemeScreenModel(
      'generate',
      {
        ...baseContext,
        title: 'ready',
        prompt: 'draw a cat',
        imageUrl: '/cat.png',
      },
      readyActions,
    )
    expect(ready.generateButtonProps.disabled).toBe(false)
    expect(ready.mintButtonProps.disabled).toBe(false)
    expect(ready.formProps['aria-busy']).toBe(false)
    expect(ready.busyNoticeProps).toMatchObject({
      role: 'status',
      'aria-live': 'polite',
    })
    expect(ready.errorNoticeProps).toMatchObject({
      role: 'alert',
      'aria-live': 'assertive',
    })
    ready.generateButtonProps.onClick?.(clickEvent())
    ready.mintButtonProps.onClick?.(clickEvent())
    expect(readyActions.generate).toHaveBeenCalledOnce()
    expect(readyActions.mint).toHaveBeenCalledOnce()

    const busy = buildCreateMemeScreenModel(
      'submitting',
      {
        ...baseContext,
        title: 'ready',
        prompt: 'draw a cat',
        imageUrl: '/cat.png',
        busy: 'Rendering…',
      },
      actions(),
    )
    expect(busy.generateButtonProps.disabled).toBe(true)
    expect(busy.mintButtonProps.disabled).toBe(true)
    expect(busy.giphySearchButtonProps.disabled).toBe(true)
    expect(busy.imageFileDropProps.disabled).toBe(true)
    expect(busy.videoFileDropProps.disabled).toBe(true)
    expect(busy.formProps['aria-busy']).toBe(true)
    expect(busy.showMintHint).toBe(false)
  })

  it('requires a rendered video before minting whenever "New video" was chosen', () => {
    const frameOnly = {
      ...baseContext,
      mode: 'remix' as const,
      remixId: 'source-1',
      remixOutput: 'video' as const,
      videoMode: 'edit' as const,
      editedFrame: '/edited.png',
      imageUrl: '/edited.png',
      title: 'ready',
    }
    const awaiting = buildCreateMemeScreenModel('remix', frameOnly, actions())
    expect(awaiting.mintButtonProps.disabled).toBe(true)
    expect(awaiting.mintHint).toBe(copy.preview.mintHint.animate)
    /* the approval panel owns the only remix control while the question is open */
    expect(awaiting.showEditedFrameApproval).toBe(true)
    expect(awaiting.showRemixButton).toBe(false)

    const animated = buildCreateMemeScreenModel(
      'remix',
      { ...frameOnly, videoUrl: '/animated.mp4', editedFrame: null },
      actions(),
    )
    expect(animated.mintButtonProps.disabled).toBe(false)
    expect(animated.showRemixButton).toBe(true)
  })

  it('carries artwork provenance and locks the mode row while a job runs', () => {
    const carried = buildCreateMemeScreenModel(
      'upload',
      {
        ...baseContext,
        mode: 'upload',
        imageUrl: '/cat.gif',
        title: 'cat',
        artworkSource: {
          provider: 'giphy',
          id: 'cat-1',
          url: 'https://giphy.com',
          author: 'catlord',
        },
      },
      actions(),
    )
    expect(carried.previewCard.originLabel).toBe(
      copy.preview.originFromAuthor(copy.preview.giphyProvider, 'catlord'),
    )
    expect(carried.previewCard.statsLabel).toBe(copy.preview.zeroStats)
    expect(carried.previewCard.valueLabel).toBe(copy.preview.zeroValue)
    expect(carried.mintHint).toBe('')
    expect(carried.getModeButtonProps('giphy').buttonProps.disabled).toBe(false)

    const running = buildCreateMemeScreenModel(
      'submitting',
      { ...baseContext, busy: 'Rendering…', busyElapsed: '1m04s' },
      actions(),
    )
    expect(running.getModeButtonProps('giphy').buttonProps.disabled).toBe(true)
    expect(running.busyElapsedLabel).toBe('1m04s')
    expect(running.showPreviewSkeleton).toBe(true)
  })

  it('reports an empty Giphy search as an empty state, not an alert', () => {
    const searched = buildCreateMemeScreenModel(
      'giphy',
      { ...baseContext, mode: 'giphy', giphyQuery: 'zzz', giphySearched: true },
      actions(),
    )
    expect(searched.err).toBeNull()
    expect(searched.giphyStatusProps).toEqual({ role: 'status' })
    expect(searched.giphyStatusHidden).toBe(false)
    expect(searched.giphyStatusText).toContain('Nothing for "zzz"')

    const fresh = buildCreateMemeScreenModel('giphy', { ...baseContext, mode: 'giphy' }, actions())
    expect(fresh.giphyStatusText).toBe('Pick a category or search to browse GIPHY.')
  })

  it('names the file caps and the next step out of a failure once', () => {
    expect(overCapMessage('image', MAX_IMAGE_BYTES + 1, MAX_IMAGE_BYTES)).toBe(
      copy.preview.overCap('image', 9, 8, copy.preview.overCapAdvice.image),
    )
    expect(overCapMessage('video', 143 * 1024 * 1024, MAX_VIDEO_BYTES)).toBe(
      'that video is 143MB — the cap is 50MB, try a shorter clip',
    )
    const failed = buildCreateMemeScreenModel(
      'error',
      { ...baseContext, err: copy.errors.creditsExhausted },
      actions(),
    )
    expect(failed.errorNextStep).toBe(copy.preview.nextStep.credits)
    expect(failed.uploadImageHelpText).toBe(copy.upload.imageHelp(8))
    expect(failed.uploadVideoHelpText).toContain('max 50MB')
  })

  it('hints Masky top-up from leftover credit phrases, not only the authored key', () => {
    for (const err of ['credits exhausted', '402', 'quota', 'balance']) {
      const failed = buildCreateMemeScreenModel('error', { ...baseContext, err }, actions())
      expect(failed.errorNextStep).toBe(copy.preview.nextStep.credits)
    }
  })

  it('hints a smaller file from copy.errors upload fallbacks, including a non-413 rejection', () => {
    for (const err of [
      copy.errors.uploadFailed,
      copy.errors.uploadRejected(413),
      copy.errors.uploadRejected(403),
    ]) {
      const failed = buildCreateMemeScreenModel('error', { ...baseContext, err }, actions())
      expect(failed.errorNextStep).toBe(copy.preview.nextStep.tooLarge)
    }
  })

  it('plumbs shareCopied and copyShareLinkLabel for idle vs copied success', () => {
    const idle = buildCreateMemeScreenModel(
      'success',
      { ...baseContext, shareCopied: false, shareCopyFailed: false },
      actions(),
    )
    expect(idle.shareCopied).toBe(false)
    expect(idle.copyShareLinkLabel).toBe(copy.form.success.copyLink)
    expect(idle.mintStatus).toBe(copy.form.success.minted)

    const copied = buildCreateMemeScreenModel(
      'success',
      { ...baseContext, shareCopied: true, shareCopyFailed: false },
      actions(),
    )
    expect(copied.shareCopied).toBe(true)
    expect(copied.copyShareLinkLabel).toBe(copy.form.copied)
    expect(copied.mintStatus).toBe(copy.form.success.copied)

    const failed = buildCreateMemeScreenModel(
      'success',
      { ...baseContext, shareCopied: false, shareCopyFailed: true },
      actions(),
    )
    expect(failed.shareCopied).toBe(false)
    expect(failed.copyShareLinkLabel).toBe(copy.form.success.copyFailed)
    expect(failed.mintStatus).toBe(copy.form.success.copyFailed)

    const both = buildCreateMemeScreenModel(
      'success',
      { ...baseContext, shareCopied: true, shareCopyFailed: true },
      actions(),
    )
    expect(both.shareCopied).toBe(true)
    expect(both.copyShareLinkLabel).toBe(copy.form.copied)
    expect(both.mintStatus).toBe(copy.form.success.copied)
  })

  it('wires each creation action bundle to its domain action', () => {
    const calls = actions()
    const model = buildCreateMemeScreenModel(
      'generate',
      {
        ...baseContext,
        title: 'ready',
        prompt: 'draw a cat',
        imageUrl: '/cat.png',
      },
      calls,
    )

    model.animateEditedButtonProps.onClick?.(clickEvent())
    model.rerunEditButtonProps.onClick?.(clickEvent())
    model.remixButtonProps.onClick?.(clickEvent())
    model.applyGiphyEditButtonProps.onClick?.(clickEvent())
    model.applyUrlEditButtonProps.onClick?.(clickEvent())
    model.generateButtonProps.onClick?.(clickEvent())
    model.mintButtonProps.onClick?.(clickEvent())

    expect(calls.animateEdited).toHaveBeenCalledOnce()
    expect(calls.remix).toHaveBeenCalledTimes(2)
    expect(calls.applyGiphyEdit).toHaveBeenCalledOnce()
    expect(calls.applyUrlEdit).toHaveBeenCalledOnce()
    expect(calls.generate).toHaveBeenCalledOnce()
    expect(calls.mint).toHaveBeenCalledOnce()
  })

  it('counts a tag only when its trimmed text is non-empty', () => {
    expect(boundTags('cats,,,,,dogs')).toBe('cats,,,,,dogs')
    expect(countTags('cats,,,,,dogs')).toBe(2)
    expect(boundTags('a,,b,,c,,d')).toBe('a,,b,,c,,d')
    expect(boundTags('a,b,c,d,e,f,g')).toBe('a,b,c,d,e')
    expect(boundTags('a,,b,,c,,d,,e,,f')).toBe('a,,b,,c,,d,,e,')
    expect(boundTags('a,b,c,d,')).toBe('a,b,c,d,')
    expect(boundTags('a,b,c,d,e,')).toBe('a,b,c,d,e,')
    expect(boundTags('a,b,c,d,e,   ,f')).toBe('a,b,c,d,e,   ')
    expect(boundTags(' cats , dogs ')).toBe(' cats , dogs ')
    expect(boundTags(',,,,,')).toBe(',,,,,')
  })
})
