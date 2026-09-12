import type { ImgHTMLAttributes, MouseEvent, RefCallback, VideoHTMLAttributes } from 'react'
import { cardMediaRef, toggleCardMedia } from '../stores/cardMediaStore'
import type { Meme } from './types'

export interface MemeCardMediaToggleProps {
  type: 'button'
  'aria-pressed': boolean
  'aria-label': string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

export type MemeCardMediaModel =
  | {
      kind: 'video'
      videoProps: Pick<
        VideoHTMLAttributes<HTMLVideoElement>,
        | 'src'
        | 'muted'
        | 'loop'
        | 'playsInline'
        | 'autoPlay'
        | 'preload'
        | 'poster'
        | 'aria-label'
      >
      /** the card's own pause/play control — the video never plays without one on screen */
      toggleProps: MemeCardMediaToggleProps
    }
  | {
      kind: 'image'
      imageProps: Pick<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'loading'>
    }

export interface MemeCardListingModel {
  shares: number
  pricePerShare: number
  /**
   * Second line of the card's 64px footer slot — the state, never a control. The boards
   * (6UR-0 `6Y7-0`, 767-0 `78S-0`) draw it lower-case under the share count, with no pill.
   */
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
  return buildCard(meme, prefersReducedMotion())
}

/** The same card with the motion branch forced, so stories and tests can render it. */
export function buildReducedMotionMemeCardModel(meme: Meme): MemeCardModel {
  return buildCard(meme, true)
}

function buildCard(meme: Meme, reducedMotion: boolean): MemeCardModel {
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
          toggleProps: {
            type: 'button',
            'aria-pressed': false,
            'aria-label': `Play ${meme.title}`,
            onClick: toggleCardMedia,
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

  const viewsLabel = meme.views === undefined ? null : meme.views.toLocaleString()
  // the reshare count drives the tier ladder, so it is never stood in for by another number
  const resharesLabel = (meme.reshareCount ?? meme.reshares).toLocaleString()
  const valueLabel = meme.value.toLocaleString()

  const listing =
    meme.listing && meme.listing.shares > 0
      ? {
          shares: meme.listing.shares,
          pricePerShare: meme.listing.pricePerShare,
          forSaleLabel: 'for sale',
          sharesLabel: `${meme.listing.shares} shares`,
          sharesA11yLabel: `${meme.listing.shares} shares for sale at ${meme.listing.pricePerShare} braincells each`,
        }
      : null

  return {
    id: meme.id,
    titleId: `meme-card-title-${meme.id}`,
    title: meme.title,
    tierKey: meme.tier.key,
    tierName: meme.tier.name,
    tierLabel: `${meme.tier.name} · ${meme.tier.rarity}`,
    detailLinkProps: { to: `/m/${meme.id}`, 'aria-label': `Open ${meme.title}` },
    media,
    viewsLabel,
    resharesLabel,
    valueLabel,
    statsA11yLabel: viewsLabel
      ? `${viewsLabel} views, ${resharesLabel} reshares`
      : `${resharesLabel} reshares`,
    valueA11yLabel: `${valueLabel} braincells card value`,
    listing,
    reducedMotion,
    mediaAutoplay: media.kind === 'video' && !reducedMotion ? 'on' : 'off',
    cardRef: cardMediaRef,
  }
}
