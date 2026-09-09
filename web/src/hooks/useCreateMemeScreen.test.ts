import type { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { GiphyResult } from '../lib/types'
import type { CreateMemeContext } from '../stores/createMemeMachine'
import {
  buildCreateMemeScreenModel,
  pendingVideoMatchesRemix,
  type CreateMemeScreenActions,
} from './useCreateMemeScreen'

const giphyResult: GiphyResult = {
  id: 'cat-1',
  title: 'Keyboard cat',
  stillUrl: '/cat-still.png',
  gifUrl: '/cat.gif',
  mp4Url: null,
  author: 'catlord',
  url: 'https://giphy.com/gifs/cat-1',
}

const baseContext: CreateMemeContext = {
  remixId: null,
  mode: 'generate',
  remixSource: null,
  remixOutput: 'image',
  videoMode: 'edit',
  motionPrompt: '',
  editedFrame: null,
  title: '',
  tags: '',
  prompt: '',
  imageUrl: '',
  videoUrl: '',
  busy: null,
  err: null,
  giphyCategories: [],
  giphyQuery: '',
  giphyResults: [],
  giphyPick: null,
  edited: false,
  resolvedSource: null,
  mintedId: null,
}

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
  }
}

function inputChange(value: string) {
  return { currentTarget: { value } } as ChangeEvent<HTMLInputElement>
}

function textareaChange(value: string) {
  return { currentTarget: { value } } as ChangeEvent<HTMLTextAreaElement>
}

function selectChange(value: string) {
  return { currentTarget: { value } } as ChangeEvent<HTMLSelectElement>
}

function keyEvent(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent<HTMLElement>
}

function clickEvent() {
  return {} as MouseEvent<HTMLButtonElement>
}

describe('pendingVideoMatchesRemix', () => {
  it('resumes a pending remix only from the route that started it', () => {
    expect(pendingVideoMatchesRemix('remix-a', 'remix-b')).toBe(false)
    expect(pendingVideoMatchesRemix('remix-a', 'remix-a')).toBe(true)
  })

  it('keeps non-remix video jobs resumable from the non-remix route', () => {
    expect(pendingVideoMatchesRemix(null, 'remix-a')).toBe(false)
    expect(pendingVideoMatchesRemix(undefined, null)).toBe(true)
    expect(pendingVideoMatchesRemix(null, null)).toBe(true)
  })
})

describe('buildCreateMemeScreenModel', () => {
  it('decodes mode, bounded title, text, and select events into domain actions', () => {
    const calls = actions()
    const model = buildCreateMemeScreenModel('remix', {
      ...baseContext,
      mode: 'remix',
      remixId: 'source-1',
      prompt: 'current prompt',
    }, calls)

    const selectedMode = model.getModeButtonProps('remix')
    expect(selectedMode).toMatchObject({ className: 'primary', 'aria-pressed': true })
    selectedMode.onClick?.(clickEvent())
    expect(calls.selectMode).toHaveBeenCalledWith('remix')
    expect(model.getModeButtonProps('generate')).toMatchObject({ className: '', 'aria-pressed': false })

    expect(model.titleInputProps.maxLength).toBe(20)
    model.titleInputProps.onChange?.(inputChange('12345678901234567890overflow'))
    model.tagsInputProps.onChange?.(inputChange('cats, chaos'))
    model.remixPromptTextareaProps.onChange?.(textareaChange('make it blue'))
    model.giphyPromptTextareaProps.onChange?.(textareaChange('make it loop'))
    model.urlPromptTextareaProps.onChange?.(textareaChange('make it late'))
    model.generatePromptTextareaProps.onChange?.(textareaChange('draw a cat'))
    model.motionPromptTextareaProps.onChange?.(textareaChange('short loop'))
    expect(calls.setTitle).toHaveBeenCalledWith('12345678901234567890')
    expect(calls.setTags).toHaveBeenCalledWith('cats, chaos')
    expect(calls.setPrompt).toHaveBeenNthCalledWith(1, 'make it blue')
    expect(calls.setPrompt).toHaveBeenNthCalledWith(2, 'make it loop')
    expect(calls.setPrompt).toHaveBeenNthCalledWith(3, 'make it late')
    expect(calls.setPrompt).toHaveBeenNthCalledWith(4, 'draw a cat')
    expect(calls.setMotionPrompt).toHaveBeenCalledWith('short loop')

    model.remixOutputSelectProps.onChange?.(selectChange('invalid'))
    model.remixOutputSelectProps.onChange?.(selectChange('video'))
    model.videoModeSelectProps.onChange?.(selectChange('invalid'))
    model.videoModeSelectProps.onChange?.(selectChange('restyle'))
    expect(calls.setRemixOutput).toHaveBeenCalledTimes(1)
    expect(calls.setRemixOutput).toHaveBeenCalledWith('video')
    expect(calls.setVideoMode).toHaveBeenCalledTimes(1)
    expect(calls.setVideoMode).toHaveBeenCalledWith('restyle')
  })

  it('owns Giphy category, query, Enter, button, and keyboard-pick behavior', () => {
    const calls = actions()
    const model = buildCreateMemeScreenModel('giphy', {
      ...baseContext,
      mode: 'giphy',
      giphyQuery: 'keyboard cat',
      giphyResults: [giphyResult],
    }, calls)

    model.giphyCategorySelectProps.onChange?.(selectChange(''))
    model.giphyCategorySelectProps.onChange?.(selectChange('Animals'))
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

    const resultProps = model.getGiphyResultProps(giphyResult)
    expect(resultProps).toMatchObject({
      src: '/cat.gif',
      alt: 'Keyboard cat',
      title: 'Keyboard cat',
      role: 'button',
      tabIndex: 0,
      'aria-pressed': false,
    })
    const space = keyEvent(' ')
    resultProps.onKeyDown?.(space as KeyboardEvent<HTMLImageElement>)
    expect(space.preventDefault).toHaveBeenCalledOnce()
    expect(calls.pickGiphy).toHaveBeenCalledWith(giphyResult)
    resultProps.onClick?.({} as MouseEvent<HTMLImageElement>)
    expect(calls.pickGiphy).toHaveBeenCalledTimes(2)

    const selected = buildCreateMemeScreenModel('giphy', {
      ...baseContext,
      mode: 'giphy',
      giphyPick: giphyResult,
    }, calls)
    expect(selected.getGiphyResultProps(giphyResult)).toMatchObject({
      className: 'giphy-cell picked',
      'aria-pressed': true,
    })
    expect(selected.giphyPick).toEqual({ title: 'Keyboard cat', authorLabel: ' (@catlord)' })
  })

  it('resolves URL input on blur or Enter and ignores unrelated keys', () => {
    const calls = actions()
    const model = buildCreateMemeScreenModel('url', { ...baseContext, mode: 'url' }, calls)

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

  it('keeps upload MIME contracts and ignores empty file selections', () => {
    const calls = actions()
    const model = buildCreateMemeScreenModel('upload', { ...baseContext, mode: 'upload' }, calls)
    const image = { name: 'cat.png', type: 'image/png', size: 8 } as File
    const video = { name: 'cat.mp4', type: 'video/mp4', size: 50 } as File

    expect(model.imageFileInputProps.accept).toBe('image/png,image/jpeg,image/gif,image/webp')
    expect(model.videoFileInputProps.accept).toBe('video/mp4,video/quicktime,video/webm')
    model.imageFileInputProps.onChange?.({ currentTarget: { files: null } } as ChangeEvent<HTMLInputElement>)
    expect(calls.uploadImage).not.toHaveBeenCalled()
    model.imageFileInputProps.onChange?.({ currentTarget: { files: [image, video] } } as unknown as ChangeEvent<HTMLInputElement>)
    model.videoFileInputProps.onChange?.({ currentTarget: { files: [video] } } as unknown as ChangeEvent<HTMLInputElement>)
    expect(calls.uploadImage).toHaveBeenCalledWith(image)
    expect(calls.uploadVideo).toHaveBeenCalledWith(video)
  })

  it('derives disabled actions and live-region ARIA from prompt, media, and busy state', () => {
    const readyActions = actions()
    const ready = buildCreateMemeScreenModel('generate', {
      ...baseContext,
      title: 'ready',
      prompt: 'draw a cat',
      imageUrl: '/cat.png',
    }, readyActions)
    expect(ready.generateButtonProps.disabled).toBe(false)
    expect(ready.mintButtonProps.disabled).toBe(false)
    expect(ready.formProps['aria-busy']).toBe(false)
    expect(ready.busyNoticeProps).toMatchObject({ role: 'status', 'aria-live': 'polite' })
    expect(ready.errorNoticeProps).toMatchObject({ role: 'alert', 'aria-live': 'assertive' })
    ready.generateButtonProps.onClick?.(clickEvent())
    ready.mintButtonProps.onClick?.(clickEvent())
    expect(readyActions.generate).toHaveBeenCalledOnce()
    expect(readyActions.mint).toHaveBeenCalledOnce()

    const busy = buildCreateMemeScreenModel('submitting', {
      ...baseContext,
      title: 'ready',
      prompt: 'draw a cat',
      imageUrl: '/cat.png',
      busy: 'Rendering…',
    }, actions())
    expect(busy.generateButtonProps.disabled).toBe(true)
    expect(busy.mintButtonProps.disabled).toBe(true)
    expect(busy.giphySearchButtonProps.disabled).toBe(true)
    expect(busy.formProps['aria-busy']).toBe(true)
    expect(busy.showMintHint).toBe(false)
  })

  it('wires each creation action bundle to its domain action', () => {
    const calls = actions()
    const model = buildCreateMemeScreenModel('generate', {
      ...baseContext,
      title: 'ready',
      prompt: 'draw a cat',
      imageUrl: '/cat.png',
    }, calls)

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
})
