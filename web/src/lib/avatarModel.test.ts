import { describe, expect, it } from 'vitest'
import type { SyntheticEvent } from 'react'
import { avatarErrorHandler, avatarInitial, avatarMonogramSrc } from './avatarModel'

const errorOn = (img: HTMLImageElement) =>
  ({ currentTarget: img }) as unknown as SyntheticEvent<HTMLImageElement, Event>

describe('avatar model', () => {
  it('reads the first grapheme of a real display name, and never renders an empty disc', () => {
    expect(avatarInitial('Issam Misto')).toBe('I')
    expect(avatarInitial('  pushrax ')).toBe('P')
    expect(avatarInitial('')).toBe('?')
    expect(avatarInitial('🧠 brain')).toBe('🧠')
  })

  it('draws the monogram as an image source, with the glyph escaped', () => {
    expect(decodeURIComponent(avatarMonogramSrc('Ada'))).toContain('>A<')
    expect(decodeURIComponent(avatarMonogramSrc('<script>'))).toContain('&lt;')
    expect(avatarMonogramSrc('Ada').startsWith('data:image/svg+xml,')).toBe(true)
  })

  it('swaps a broken picture for the monogram exactly once', () => {
    // the unit project runs on node: the handler only ever touches `src` and `dataset`
    const img = { src: 'https://lh3.googleusercontent.com/a/gone=s96-c', dataset: {} } as unknown as HTMLImageElement
    const onError = avatarErrorHandler('Issam Misto')

    onError(errorOn(img))
    const fallback = img.src
    expect(decodeURIComponent(fallback)).toContain('>I<')
    expect(img.dataset.avatarFallback).toBe('true')

    // a monogram that itself fails to decode must not re-enter the swap
    onError(errorOn(img))
    expect(img.src).toBe(fallback)
  })
})
