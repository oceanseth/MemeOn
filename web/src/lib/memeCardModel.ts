import type { ImgHTMLAttributes, VideoHTMLAttributes } from 'react'
import type { Meme } from './types'

export type MemeCardMediaModel =
  | {
      kind: 'video'
      videoProps: Pick<
        VideoHTMLAttributes<HTMLVideoElement>,
        'src' | 'muted' | 'loop' | 'playsInline' | 'autoPlay' | 'poster' | 'aria-label'
      >
    }
  | {
      kind: 'image'
      imageProps: Pick<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'loading'>
    }

export interface MemeCardListingModel {
  shares: number
  pricePerShare: number
  sharesLabel: string
}

export interface MemeCardModel {
  id: string
  title: string
  tierKey: string
  tierColor: string
  tierLabel: string
  detailLinkProps: { to: string }
  media: MemeCardMediaModel
  viewsLabel: string
  resharesLabel: string
  valueLabel: string
  listing: MemeCardListingModel | null
}

export function buildMemeCardModel(meme: Meme): MemeCardModel {
  const media: MemeCardMediaModel =
    meme.mediaType === 'video' && meme.videoUrl
      ? {
          kind: 'video',
          videoProps: {
            src: meme.videoUrl,
            muted: true,
            loop: true,
            playsInline: true,
            autoPlay: true,
            poster: meme.imageUrl,
            'aria-label': meme.title,
          },
        }
      : {
          kind: 'image',
          imageProps: {
            src: meme.imageUrl,
            alt: meme.title,
            loading: 'lazy',
          },
        }

  const listing =
    meme.listing && meme.listing.shares > 0
      ? {
          shares: meme.listing.shares,
          pricePerShare: meme.listing.pricePerShare,
          sharesLabel: `${meme.listing.shares} sh @ 🧠${meme.listing.pricePerShare}`,
        }
      : null

  return {
    id: meme.id,
    title: meme.title,
    tierKey: meme.tier.key,
    tierColor: meme.tier.color,
    tierLabel: `${meme.tier.name} · ${meme.tier.rarity}`,
    detailLinkProps: { to: `/m/${meme.id}` },
    media,
    viewsLabel: (meme.views ?? meme.reshares).toLocaleString(),
    resharesLabel: (meme.reshareCount ?? 0).toLocaleString(),
    valueLabel: meme.value.toLocaleString(),
    listing,
  }
}
