import { describe, expect, it } from 'vitest'
import { tierFor } from '@memeon/shared/tiers'
import { memeCardCopy as copy } from '../copy/memeCard'
import {
  buildMemeCardModel,
  buildReducedMotionMemeCardModel,
  MEME_ASPECT_MAX,
  MEME_ASPECT_MIN,
  memeFrameAspect,
  splitMeasured,
} from './memeCardModel'
import { memeMediaSize, memeMediaTarget, type MediaMeasure } from './memeMediaSize'
import type { Meme } from './types'

const imageMeme: Meme = {
  id: 'meme-1',
  title: 'foil cat',
  description: null,
  mediaType: 'image',
  imageUrl: '/foil-cat.png',
  videoUrl: null,
  tags: [],
  creatorId: 'creator-1',
  creatorName: 'creator',
  ownerId: 'owner-1',
  ownerName: 'owner',
  reshares: 1234,
  tierKey: 'holo',
  listing: { sellerId: 'seller-1', shares: 10, pricePerShare: 3 },
  createdAt: '2026-09-08T00:00:00.000Z',
  tier: tierFor(50),
  value: 5678,
}

describe('buildMemeCardModel', () => {
  it('builds the detail link, tier and listing labels', () => {
    const model = buildMemeCardModel(imageMeme)

    expect(model.detailLinkProps).toEqual({
      to: '/m/meme-1',
      'aria-label': copy.open('foil cat'),
    })
    expect(model.titleId).toBe('meme-card-title-meme-1')
    expect(model.tierName).toBe('Holo')
    expect(model.tierLabel).toBe(copy.tierLabel(imageMeme.tier.name, imageMeme.tier.rarity))
    expect(model.valueLabel).toBe('5.7k')
    expect(model.valueA11yLabel).toBe(copy.valueA11y('5,678'))
    expect(model.listing).toEqual({
      shares: 10,
      pricePerShare: 3,
      // One compact right-side badge; the full sentence lives in the sr-only label
      badgeLabel: copy.forSaleBadge(10),
      sharesA11yLabel: copy.sharesForSaleAt(10, 3),
    })
  })

  it('never stands one metric in for another: no views means no views stat', () => {
    const thin = buildMemeCardModel(imageMeme)

    expect(thin.viewsLabel).toBeNull()
    expect(thin.resharesLabel).toBe('0')
    expect(thin.statsA11yLabel).toBe(copy.stats(null, 0))

    const full = buildMemeCardModel({
      ...imageMeme,
      views: 9876,
      reshareCount: 60,
    })

    expect(full.viewsLabel).toBe('9.9k')
    expect(full.resharesLabel).toBe('60')
    expect(full.statsA11yLabel).toBe(copy.stats(9876, 60))
  })

  it('leaves the media unnamed and excludes empty listings', () => {
    const model = buildMemeCardModel({
      ...imageMeme,
      listing: { sellerId: 'seller-1', shares: 0, pricePerShare: 3 },
    })

    // one element: nothing sits behind the art
    expect(model.media).toEqual({
      kind: 'image',
      imageProps: { src: '/foil-cat.png', alt: '', loading: 'lazy' },
    })
    expect(model.listing).toBeNull()
  })

  it('selects video media only when a video URL is available', () => {
    const video = buildMemeCardModel({
      ...imageMeme,
      mediaType: 'video',
      videoUrl: '/foil-cat.mp4',
    })
    const missingVideo = buildMemeCardModel({
      ...imageMeme,
      mediaType: 'video',
      videoUrl: null,
    })

    expect(video.media.kind).toBe('video')
    if (video.media.kind !== 'video') throw new Error('expected video media')
    expect(video.media.videoProps).toEqual({
      src: '/foil-cat.mp4',
      muted: true,
      loop: true,
      playsInline: true,
      autoPlay: false,
      preload: 'none',
      poster: '/foil-cat.png',
      'aria-label': '',
    })
    expect('toggleProps' in video.media).toBe(false)
    expect(missingVideo.media.kind).toBe('image')
  })

  it('lets the viewport observer start video only when motion is welcome', () => {
    const videoMeme = {
      ...imageMeme,
      mediaType: 'video' as const,
      videoUrl: '/foil-cat.mp4',
    }

    expect(buildMemeCardModel(videoMeme).mediaAutoplay).toBe('on')
    expect(buildReducedMotionMemeCardModel(videoMeme).mediaAutoplay).toBe('off')
    expect(buildReducedMotionMemeCardModel(videoMeme).reducedMotion).toBe(true)
    // a still card has nothing to start either way
    expect(buildMemeCardModel(imageMeme).mediaAutoplay).toBe('off')
  })

  it('speaks one share in the singular', () => {
    expect(copy.sharesForSaleAt(1, 3)).toBe('1 share for sale at 3 braincells each')
    expect(copy.sharesForSaleAt(10, 3)).toBe('10 shares for sale at 3 braincells each')

    const model = buildMemeCardModel({
      ...imageMeme,
      listing: { sellerId: 'seller-1', shares: 1, pricePerShare: 3 },
    })

    expect(model.listing).toEqual({
      shares: 1,
      pricePerShare: 3,
      badgeLabel: copy.forSaleBadge(1),
      sharesA11yLabel: copy.sharesForSaleAt(1, 3),
    })
  })
})

describe('memeFrameAspect', () => {
  const size = (width: number, height: number) => ({ width, height })

  it('takes the exact ratio inside the clamp', () => {
    expect(memeFrameAspect(size(480, 270))).toBe(480 / 270)
    expect(memeFrameAspect(size(640, 640))).toBe(1)
    // the clamp bounds themselves are still the art's own ratio
    expect(memeFrameAspect(size(200, 400))).toBe(0.5)
    expect(memeFrameAspect(size(400, 200))).toBe(2)
  })

  it('stops the grid frame at both ends of the clamp', () => {
    expect(memeFrameAspect(size(100, 400))).toBe(MEME_ASPECT_MIN)
    expect(memeFrameAspect(size(900, 200))).toBe(MEME_ASPECT_MAX)
  })

  it('keeps the true ratio, unclamped, when the meme is shown whole', () => {
    expect(memeFrameAspect(size(100, 400), 'whole')).toBe(0.25)
    expect(memeFrameAspect(size(900, 200), 'whole')).toBe(4.5)
    expect(memeFrameAspect(size(480, 270), 'whole')).toBe(480 / 270)
  })

  it('is null while the size is unknown and a covered square when it could not be read', () => {
    expect(memeFrameAspect(undefined)).toBeNull()
    expect(memeFrameAspect(undefined, 'whole')).toBeNull()
    expect(memeFrameAspect('failed')).toBe(1)
    expect(memeFrameAspect('failed', 'whole')).toBe(1)
  })

  it('treats a garbage size as a failed one', () => {
    expect(memeFrameAspect(size(0, 100))).toBe(1)
    expect(memeFrameAspect(size(100, -4))).toBe(1)
    expect(memeFrameAspect(size(Number.NaN, 100))).toBe(1)
    expect(memeFrameAspect(size(Number.POSITIVE_INFINITY, 100))).toBe(1)
  })
})

describe('the card model frame', () => {
  const measured = (sizes: Record<string, MediaMeasure>) => ({ get: (url: string) => sizes[url] })

  it('prefers the stored dims', () => {
    const model = buildMemeCardModel({ ...imageMeme, width: 320, height: 568 })
    expect(model.aspect).toBeCloseTo(320 / 568)
    // a stored size wins over whatever was measured for the URL
    expect(
      memeMediaSize(
        { ...imageMeme, width: 320, height: 568 },
        measured({ '/foil-cat.png': { width: 1, height: 1 } }),
      ),
    ).toEqual({ width: 320, height: 568 })
  })

  it('falls through to the measured size when the record has none, or garbage', () => {
    const store = measured({ '/foil-cat.png': { width: 300, height: 200 } })
    expect(memeMediaSize(imageMeme, store)).toEqual({ width: 300, height: 200 })
    expect(memeMediaSize({ ...imageMeme, width: 0, height: 0 }, store)).toEqual({
      width: 300,
      height: 200,
    })
    expect(memeMediaSize({ ...imageMeme, width: 480 }, store)).toEqual({ width: 300, height: 200 })
    expect(memeFrameAspect(memeMediaSize(imageMeme, store))).toBe(1.5)
  })

  it('measures a video from its poster, or from the video without one', () => {
    const video = { ...imageMeme, mediaType: 'video' as const, videoUrl: '/foil-cat.mp4' }
    expect(memeMediaTarget(video)).toEqual({ url: '/foil-cat.png', kind: 'image' })
    expect(memeMediaTarget({ ...video, imageUrl: '' })).toEqual({
      url: '/foil-cat.mp4',
      kind: 'video',
    })
    expect(memeMediaTarget({ ...imageMeme, imageUrl: '' })).toBeNull()
    // nothing to measure is a failed measurement, not an endless wait
    expect(memeMediaSize({ ...imageMeme, imageUrl: '' }, measured({}))).toBe('failed')
  })

  it('waits (null) on a meme with no dims that has not been measured', () => {
    expect(buildMemeCardModel(imageMeme).aspect).toBeNull()
  })
})

describe('splitMeasured', () => {
  const card = (id: string, aspect: number | null) => ({ id, aspect })
  const aspectOf = (item: { aspect: number | null }) => item.aspect

  it('places the measured run from the start and holds back everything after a gap', () => {
    const items = [card('a', 1), card('b', 0.5), card('c', null), card('d', 2)]
    const { placed, waiting } = splitMeasured(items, aspectOf)
    expect(placed.map((item) => item.id)).toEqual(['a', 'b'])
    // `d` is known, but placing it before `c` would move it when `c` lands
    expect(waiting.map((item) => item.id)).toEqual(['c', 'd'])
  })

  it('places everything once everything is known', () => {
    const items = [card('a', 1), card('b', 1)]
    expect(splitMeasured(items, aspectOf)).toEqual({ placed: items, waiting: [] })
    expect(splitMeasured([], aspectOf)).toEqual({ placed: [], waiting: [] })
  })
})
