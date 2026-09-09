import { describe, expect, it } from 'vitest'
import { tierFor } from '../../../shared/tiers'
import { buildMemeCardModel } from './memeCardModel'
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
  it('builds the detail link, fallback counts, tier and listing labels', () => {
    const model = buildMemeCardModel(imageMeme)

    expect(model.detailLinkProps).toEqual({ to: '/m/meme-1' })
    expect(model.tierLabel).toBe('Holo · Rare')
    expect(model.viewsLabel).toBe('1,234')
    expect(model.resharesLabel).toBe('0')
    expect(model.valueLabel).toBe('5,678')
    expect(model.listing).toEqual({
      shares: 10,
      pricePerShare: 3,
      sharesLabel: '10 sh @ 🧠3',
    })
  })

  it('supplies accessible image props and excludes empty listings', () => {
    const model = buildMemeCardModel({
      ...imageMeme,
      listing: { sellerId: 'seller-1', shares: 0, pricePerShare: 3 },
    })

    expect(model.media).toEqual({
      kind: 'image',
      imageProps: { src: '/foil-cat.png', alt: 'foil cat', loading: 'lazy' },
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

    expect(video.media).toEqual({
      kind: 'video',
      videoProps: {
        src: '/foil-cat.mp4',
        muted: true,
        loop: true,
        playsInline: true,
        autoPlay: true,
        poster: '/foil-cat.png',
        'aria-label': 'foil cat',
      },
    })
    expect(missingVideo.media.kind).toBe('image')
  })
})
