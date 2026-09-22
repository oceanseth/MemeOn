import type { ImgHTMLAttributes, RefCallback, VideoHTMLAttributes } from 'react'
import { memeCardCopy as copy } from '../copy/memeCard'
import { cardMediaRef } from './cardMedia'
import { humanize } from './humanize'
import { memeReshareCount } from './memeMetrics'
import { getPlayVideosSnapshot } from './playbackPreference'
import type { Meme } from './types'

export type MemeCardMediaModel =
  | {
      kind: 'video'
      backdropImageProps: Pick<
        ImgHTMLAttributes<HTMLImageElement>,
        'src' | 'alt' | 'aria-hidden' | 'loading'
      >
      videoProps: Pick<
        VideoHTMLAttributes<HTMLVideoElement>,
        'src' | 'muted' | 'loop' | 'playsInline' | 'autoPlay' | 'preload' | 'poster' | 'aria-label'
      >
    }
  | {
      kind: 'image'
      backdropImageProps: Pick<
        ImgHTMLAttributes<HTMLImageElement>,
        'src' | 'alt' | 'aria-hidden' | 'loading'
      >
      imageProps: Pick<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'loading'>
    }

export interface MemeCardListingModel {
  shares: number
  pricePerShare: number
  /** Footer second line — lowercase listing state, no pill. */
  forSaleLabel: string
  /** first line of the same slot: `12 shares` */
  sharesLabel: string
  /** both lines plus the price, which the card itself no longer prints */
  sharesA11yLabel: string
}

export interface MemeCardModel {
  id: string
  /** id of the visible title, so the card's <article> is named by the text a sighted player reads */
  titleId: string
  title: string
  tierKey: string
  /** the tier's product name on its own — what the `TierChip` prints */
  tierName: string
  /** name and rarity together, for the labels a card is announced by */
  tierLabel: string
  detailLinkProps: { to: string; 'aria-label': string }
  media: MemeCardMediaModel
  /** null when the record carries no view count — never borrowed from another metric */
  viewsLabel: string | null
  resharesLabel: string
  valueLabel: string
  /** the emoji stat row spelled out; the visible row is aria-hidden so nothing is read twice */
  statsA11yLabel: string
  valueA11yLabel: string
  listing: MemeCardListingModel | null
  /** the OS motion preference at build time; when set, video rests on its poster */
  reducedMotion: boolean
  /** read by the viewport observer: whether this card may start its own media */
  mediaAutoplay: 'on' | 'off'
  /** pauses the foil ring and the video while the card is off screen */
  cardRef: RefCallback<HTMLElement>
}

/* Built once at load and read live on each build: a grid rebuilds its card models on every render. */
const motionQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

const prefersReducedMotion = (): boolean => motionQuery?.matches ?? false

/** Map-safe: every grid builds its cards with `memes.map(buildMemeCardModel)`. */
export function buildMemeCardModel(meme: Meme): MemeCardModel {
  return buildCard(meme, prefersReducedMotion(), getPlayVideosSnapshot().playVideos)
}

/** Same builder, with the Play videos preference supplied by the live hook. */
export function buildMemeCardModelForPlayback(meme: Meme, playVideos: boolean): MemeCardModel {
  return buildCard(meme, prefersReducedMotion(), playVideos)
}

/** The same card with the motion branch forced, so stories and tests can render it. */
export function buildReducedMotionMemeCardModel(meme: Meme): MemeCardModel {
  return buildCard(meme, true, false)
}

function buildCard(meme: Meme, reducedMotion: boolean, playVideos: boolean): MemeCardModel {
  const media: MemeCardMediaModel =
    meme.mediaType === 'video' && meme.videoUrl
      ? {
          kind: 'video',
          backdropImageProps: {
            src: meme.imageUrl,
            alt: '',
            'aria-hidden': true,
            loading: 'lazy',
          },
          videoProps: {
            src: meme.videoUrl,
            muted: true,
            loop: true,
            playsInline: true,
            // the viewport observer starts it; the poster is the resting state everywhere else
            autoPlay: false,
            preload: 'none',
            poster: meme.imageUrl,
            'aria-label': '',
          },
        }
      : {
          kind: 'image',
          backdropImageProps: {
            src: meme.imageUrl,
            alt: '',
            'aria-hidden': true,
            loading: 'lazy',
          },
          imageProps: {
            src: meme.imageUrl,
            // the card's <article> and the link already carry the title; a third read is noise
            alt: '',
            loading: 'lazy',
          },
        }

  const viewsLabel = meme.views === undefined ? null : humanize(meme.views)
  const resharesLabel = humanize(memeReshareCount(meme))
  const valueLabel = humanize(meme.value)
  const valueExact = meme.value.toLocaleString()

  const listing =
    meme.listing && meme.listing.shares > 0
      ? {
          shares: meme.listing.shares,
          pricePerShare: meme.listing.pricePerShare,
          forSaleLabel: copy.forSale,
          sharesLabel: copy.shares(meme.listing.shares),
          sharesA11yLabel: copy.sharesForSaleAt(meme.listing.shares, meme.listing.pricePerShare),
        }
      : null

  return {
    id: meme.id,
    titleId: `meme-card-title-${meme.id}`,
    title: meme.title,
    tierKey: meme.tier.key,
    tierName: meme.tier.name,
    tierLabel: `${meme.tier.name} · ${meme.tier.rarity}`,
    detailLinkProps: {
      to: `/m/${meme.id}`,
      'aria-label': copy.open(meme.title),
    },
    media,
    viewsLabel,
    resharesLabel,
    valueLabel,
    statsA11yLabel: copy.stats(
      meme.views === undefined ? null : meme.views,
      memeReshareCount(meme),
    ),
    valueA11yLabel: copy.valueA11y(valueExact),
    listing,
    reducedMotion,
    mediaAutoplay: media.kind === 'video' && !reducedMotion && playVideos ? 'on' : 'off',
    cardRef: cardMediaRef,
  }
}
