import { describe, expect, it } from 'vitest'
import { tierFor } from '../../../shared/tiers'
import { buildMemeCardModel, buildReducedMotionMemeCardModel } from './memeCardModel'
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
  views: undefined,
  reshareCount: undefined,
}

describe('buildMemeCardModel', () => {
  it('builds the detail link, tier and listing labels', () => {
    const model = buildMemeCardModel(imageMeme)

    expect(model.detailLinkProps).toEqual({ to: '/m/meme-1', 'aria-label': 'Open foil cat' })
    expect(model.titleId).toBe('meme-card-title-meme-1')
    expect(model.tierName).toBe('Holo')
    expect(model.tierLabel).toBe('Holo · Rare')
    expect(model.valueLabel).toBe('5,678')
    expect(model.valueA11yLabel).toBe('5,678 braincells card value')
    expect(model.listing).toEqual({
      shares: 10,
      pricePerShare: 3,
      // the board copy: two lines in the card's 64px footer slot, no pill on the art
      forSaleLabel: 'for sale',
      sharesLabel: '10 shares',
      sharesA11yLabel: '10 shares for sale at 3 braincells each',
    })
  })

  it('never stands one metric in for another: no views means no views stat', () => {
    const thin = buildMemeCardModel(imageMeme)

    expect(thin.viewsLabel).toBeNull()
    expect(thin.resharesLabel).toBe('1,234')
    expect(thin.statsA11yLabel).toBe('1,234 reshares')

    const full = buildMemeCardModel({ ...imageMeme, views: 9876, reshareCount: 60 })

    expect(full.viewsLabel).toBe('9,876')
    expect(full.resharesLabel).toBe('60')
    expect(full.statsA11yLabel).toBe('9,876 views, 60 reshares')
  })

  it('leaves the media unnamed and excludes empty listings', () => {
    const model = buildMemeCardModel({
      ...imageMeme,
      listing: { sellerId: 'seller-1', shares: 0, pricePerShare: 3 },
    })

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
    expect(video.media.toggleProps['aria-label']).toBe('Play foil cat')
    expect(video.media.toggleProps['aria-pressed']).toBe(false)
    expect(missingVideo.media.kind).toBe('image')
  })

  it('lets the viewport observer start video only when motion is welcome', () => {
    const videoMeme = { ...imageMeme, mediaType: 'video' as const, videoUrl: '/foil-cat.mp4' }

    expect(buildMemeCardModel(videoMeme).mediaAutoplay).toBe('on')
    expect(buildReducedMotionMemeCardModel(videoMeme).mediaAutoplay).toBe('off')
    expect(buildReducedMotionMemeCardModel(videoMeme).reducedMotion).toBe(true)
    // a still card has nothing to start either way
    expect(buildMemeCardModel(imageMeme).mediaAutoplay).toBe('off')
  })
})
