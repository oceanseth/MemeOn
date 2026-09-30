import type { ImgHTMLAttributes, RefCallback, VideoHTMLAttributes } from 'react'
import { memeCardCopy as copy } from '../copy/memeCard'
import { cardMediaRef } from './cardMedia'
import { humanize } from './humanize'
import { isMediaSize, memeMediaSize, type MediaMeasure } from './memeMediaSize'
import { memeReshareCount } from './memeMetrics'
import { getPlayVideosSnapshot } from './playbackPreference'
import type { Meme } from './types'

/** Grid frame ratio clamp: 1:2 tall … 2:1 wide. Past it the frame stops and the art centre-crops. */
export const MEME_ASPECT_MIN = 0.5
export const MEME_ASPECT_MAX = 2

/**
 * The art window's ratio for a meme's media size. The window takes the media's own `w/h`, so the
 * art covers it edge to edge and crops nothing. A grid (`'grid'`) stops the frame at the clamp and
 * the art centre-crops past it; the detail hero (`'whole'`) shows every meme whole, unclamped. A
 * failed measurement is a square the art covers; `null` means the size is not known yet, and a
 * grid holds that card back until it is (`memeMediaSize`).
 */
export function memeFrameAspect(
  size: MediaMeasure | undefined,
  fit: 'grid' | 'whole' = 'grid',
): number | null {
  if (size === undefined) return null
  if (size === 'failed' || !isMediaSize(size.width, size.height)) return 1
  const ratio = size.width / size.height
  return fit === 'whole' ? ratio : Math.min(MEME_ASPECT_MAX, Math.max(MEME_ASPECT_MIN, ratio))
}

/**
 * Fixed grids place cards in feed order, so a card still being measured holds back every card
 * after it: the grid shows the measured run and one skeleton per card still waiting. A later
 * card landing never moves one already shown (those grids align their rows to the top).
 */
export function splitMeasured<T>(
  items: readonly T[],
  aspectOf: (item: T) => number | null,
): { placed: T[]; waiting: T[] } {
  const firstWaiting = items.findIndex((item) => aspectOf(item) === null)
  const cut = firstWaiting === -1 ? items.length : firstWaiting
  return { placed: items.slice(0, cut), waiting: items.slice(cut) }
}

export type MemeCardMediaModel =
  | {
      kind: 'video'
      videoProps: Pick<
        VideoHTMLAttributes<HTMLVideoElement>,
        'src' | 'muted' | 'loop' | 'playsInline' | 'autoPlay' | 'preload' | 'poster' | 'aria-label'
      >
    }
  | {
      kind: 'image'
      imageProps: Pick<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'loading'>
    }

export interface MemeCardListingModel {
  shares: number
  pricePerShare: number
  /** the one short right-side badge: `12 for sale` */
  badgeLabel: string
  /** the badge plus the price, which the card itself no longer prints */
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
  /**
   * `width / height` of the art window, which the art covers edge to edge: the media's own ratio
   * clamped to the grid's range, 1 when it could not be measured, `null` while it is being measured
   */
  aspect: number | null
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

/** The same card with the motion branch forced, so a test can reach it. */
export function buildReducedMotionMemeCardModel(meme: Meme): MemeCardModel {
  return buildCard(meme, true, false)
}

function buildCard(meme: Meme, reducedMotion: boolean, playVideos: boolean): MemeCardModel {
  const media: MemeCardMediaModel =
    meme.mediaType === 'video' && meme.videoUrl
      ? {
          kind: 'video',
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
          badgeLabel: copy.forSaleBadge(meme.listing.shares),
          sharesA11yLabel: copy.sharesForSaleAt(meme.listing.shares, meme.listing.pricePerShare),
        }
      : null

  const aspect = memeFrameAspect(memeMediaSize(meme))

  return {
    id: meme.id,
    titleId: `meme-card-title-${meme.id}`,
    title: meme.title,
    tierKey: meme.tier.key,
    tierName: meme.tier.name,
    tierLabel: copy.tierLabel(meme.tier.name, meme.tier.rarity),
    detailLinkProps: {
      to: `/m/${meme.id}`,
      'aria-label': copy.open(meme.title),
    },
    media,
    aspect,
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
