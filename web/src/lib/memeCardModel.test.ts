import { describe, expect, it } from 'vitest'
import { tierFor } from '@memeon/shared/tiers'
import { memeCardCopy as copy } from '../copy/memeCard'
import { buildMemeCardModel, buildReducedMotionMemeCardModel, memeFrameAspect } from './memeCardModel'
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

    expect(model.media).toEqual({
      kind: 'image',
      backdropImageProps: {
        src: '/foil-cat.png',
        alt: '',
        'aria-hidden': true,
        loading: 'lazy',
      },
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
  it('takes the exact ratio and covers inside the clamp', () => {
    expect(memeFrameAspect(480, 270)).toEqual({ aspect: 480 / 270, artFit: 'cover' })
    expect(memeFrameAspect(640, 640)).toEqual({ aspect: 1, artFit: 'cover' })
    // the clamp bounds themselves still fill exactly
    expect(memeFrameAspect(200, 400)).toEqual({ aspect: 0.5, artFit: 'cover' })
    expect(memeFrameAspect(400, 200)).toEqual({ aspect: 2, artFit: 'cover' })
  })

  it('clamps extreme ratios and falls back to contain', () => {
    expect(memeFrameAspect(100, 400)).toEqual({ aspect: 0.5, artFit: 'contain' })
    expect(memeFrameAspect(900, 200)).toEqual({ aspect: 2, artFit: 'contain' })
  })

  it('renders unknown or degenerate dims as a 1:1 contain frame', () => {
    expect(memeFrameAspect(undefined, undefined)).toEqual({ aspect: 1, artFit: 'contain' })
    expect(memeFrameAspect(480, undefined)).toEqual({ aspect: 1, artFit: 'contain' })
    expect(memeFrameAspect(undefined, 270)).toEqual({ aspect: 1, artFit: 'contain' })
    expect(memeFrameAspect(0, 0)).toEqual({ aspect: 1, artFit: 'contain' })
    expect(memeFrameAspect(0, 100)).toEqual({ aspect: 1, artFit: 'contain' })
  })

  it('is what the built card model carries', () => {
    const model = buildMemeCardModel({ ...imageMeme, width: 320, height: 568 })
    expect(model.aspect).toBeCloseTo(320 / 568)
    expect(model.artFit).toBe('cover')
    const legacy = buildMemeCardModel(imageMeme)
    expect(legacy.aspect).toBe(1)
    expect(legacy.artFit).toBe('contain')
  })
})
