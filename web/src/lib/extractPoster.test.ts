import { describe, expect, it } from 'vitest'
import { POSTER_MAX_SIDE, posterSize } from './extractPoster'

describe('posterSize', () => {
  it('keeps a landscape video whole instead of cropping it square', () => {
    expect(posterSize(640, 424)).toEqual({ width: 640, height: 424 })
  })

  it('keeps a portrait video whole', () => {
    expect(posterSize(720, 1280)).toEqual({ width: 720, height: 1280 })
  })

  it('scales an oversized video down by its long side and keeps the ratio', () => {
    expect(posterSize(3840, 2160)).toEqual({ width: POSTER_MAX_SIDE, height: 720 })
    expect(posterSize(2160, 3840)).toEqual({ width: 720, height: POSTER_MAX_SIDE })
  })

  it('never scales a small video up', () => {
    expect(posterSize(200, 100)).toEqual({ width: 200, height: 100 })
  })
})
