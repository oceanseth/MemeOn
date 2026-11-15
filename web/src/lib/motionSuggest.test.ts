import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  canSuggestMotion,
  frameTimes,
  MOTION_SUGGESTION_MAX,
  suggestMotion,
  tidyMotionSuggestion,
} from './motionSuggest'

function stubModel(availability: string | Error) {
  const create = vi.fn()
  vi.stubGlobal('LanguageModel', {
    availability: vi.fn(() =>
      availability instanceof Error ? Promise.reject(availability) : Promise.resolve(availability),
    ),
    create,
  })
  return { create }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('frameTimes', () => {
  it('spreads the frames through the clip, clear of both ends', () => {
    expect(frameTimes(4, 4)).toEqual([0.5, 1.5, 2.5, 3.5])
  })

  it('has nothing to sample from a clip without a length', () => {
    expect(frameTimes(0)).toEqual([])
    expect(frameTimes(Number.NaN)).toEqual([])
    expect(frameTimes(Number.POSITIVE_INFINITY)).toEqual([])
  })
})

describe('tidyMotionSuggestion', () => {
  it('strips the quotes and line breaks a model wraps its answer in', () => {
    expect(tidyMotionSuggestion(' "A man turns\n and laughs." ')).toBe('A man turns and laughs.')
  })

  it('treats an empty answer as no answer', () => {
    expect(tidyMotionSuggestion('  \n ')).toBeNull()
    expect(tidyMotionSuggestion('""')).toBeNull()
  })

  it('cuts a rambling answer back to its last whole sentence', () => {
    const tidy = tidyMotionSuggestion(`The cat jumps. ${'It keeps going and going '.repeat(20)}`)
    expect(tidy).toBe('The cat jumps.')
  })

  it('caps one endless sentence at the limit', () => {
    expect(tidyMotionSuggestion('a'.repeat(500))).toHaveLength(MOTION_SUGGESTION_MAX)
  })
})

describe('canSuggestMotion', () => {
  it('is false in a browser without the Prompt API', async () => {
    await expect(canSuggestMotion()).resolves.toBe(false)
  })

  it('is true only when the model is already on the machine', async () => {
    stubModel('available')
    await expect(canSuggestMotion()).resolves.toBe(true)
  })

  it.each(['downloadable', 'downloading', 'unavailable'])(
    'is false when the model is %s',
    async (state) => {
      stubModel(state)
      await expect(canSuggestMotion()).resolves.toBe(false)
    },
  )

  it('is false when asking throws', async () => {
    stubModel(new Error('NotSupportedError'))
    await expect(canSuggestMotion()).resolves.toBe(false)
  })
})

describe('suggestMotion', () => {
  it('resolves null without the Prompt API', async () => {
    await expect(suggestMotion('https://files/clip.mp4')).resolves.toBeNull()
  })

  it('never starts a model download to get a suggestion', async () => {
    const { create } = stubModel('downloadable')
    await expect(suggestMotion('https://files/clip.mp4')).resolves.toBeNull()
    expect(create).not.toHaveBeenCalled()
  })
})
