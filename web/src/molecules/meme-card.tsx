import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { MemeCardModel } from '../lib/memeCardModel'
import { FoilCard, FoilMedia } from '@/atoms/foil-frame'
import { Icon } from '@/atoms/icon'
import { TierSeal } from '@/atoms/tier-seal'
import { DialogTrigger } from '@/atoms/dialog'

/* The card is a container for its own meta row (`@max-card-narrow:` fires under 220px). Its
   focus ring follows the artwork's navigation link or enlargement button.
   Every card in a grid is the same size: the track sets the width, and the height is the same by
   construction — the title reserves its two lines and the value row reserves the two-line listing
   slot — so the card is left free to stretch to its track (no `self-start`) and a screen's own
   per-card footer cannot make a row ragged either. */
const memeCardVariants = cva(
  [
    'group relative isolate',
    '@container',
    'transition-lift',
    'pointer-coarse:active:scale-99',
    'focus-ring-within',
  ],
  {
    variants: {
      size: {
        /** the grid thumb lifts and grows a hair on a fine-pointer hover; stillness under reduced motion */
        default: [
          'pointer-fine:hover:-translate-y-1',
          'pointer-fine:hover:scale-101',
          'motion-reduce:hover:translate-y-0! motion-reduce:hover:scale-100!',
        ],
        /** the detail hero holds still */
        lg: '',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

/* `flex-1`: the meta fills a stretched card, so a footer can pin itself to the bottom with `mt-auto` */
const memeMetaVariants = cva('flex flex-1 flex-col', {
  variants: {
    size: {
      default: 'gap-1 px-1 pt-3 pb-0 @max-card-narrow:pt-2.5',
      lg: 'gap-1.5 px-1.5 pt-4 pb-1',
    },
  },
  defaultVariants: { size: 'default' },
})

const memeTitleVariants = cva('m-0 font-display font-normal text-foreground', {
  variants: {
    size: {
      /** two lines are reserved (2 × 24, or 2 × 26 in the narrow text face), so a one-line title
       *  leaves the stats and the value row where every neighbour has them */
      default: [
        'line-clamp-2 min-h-12 text-xl',
        '@max-card-narrow:min-h-13 @max-card-narrow:font-sans @max-card-narrow:text-lg @max-card-narrow:font-semibold',
      ],
      lg: 'text-3xl',
    },
  },
  defaultVariants: { size: 'default' },
})

/** `default` grid thumb · `lg` detail hero. */
export type MemeCardSize = NonNullable<VariantProps<typeof memeCardVariants>['size']>

const INNER = cn('relative flex h-full flex-col')

const ART_BACKDROP =
  'absolute inset-0 z-0 block size-full scale-110 object-cover opacity-45 blur-lg saturate-125'

const ART = cn('block object-contain')

const KICKER =
  'flex min-h-4 items-center justify-between gap-2 text-xs text-muted-foreground @max-card-narrow:min-h-8.5 @max-card-narrow:flex-col @max-card-narrow:items-start @max-card-narrow:justify-start @max-card-narrow:gap-0.5'

/* the tier name is set in caps: it takes the caps tracking the other two eyebrows wear */
const TIER_NAME = cn('font-semibold tracking-wider text-foreground uppercase')

const STATS = cn('flex items-center')

/* the grid thumb reserves the two-line listing slot (2 × 16) whether or not it is for sale; the
   narrow form may wrap its right lane under the value (20 + 2 + 16), and reserves that instead */
const memeSubVariants = cva(
  [
    'flex items-start justify-between gap-2 text-xs font-medium text-foreground',
    '@max-card-narrow:flex-wrap @max-card-narrow:gap-y-0.5',
  ],
  {
    variants: {
      size: {
        default: 'min-h-8 @max-card-narrow:min-h-9.5',
        lg: '',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

const VALUE = 'text-sm font-semibold text-foreground'

const RIGHT_SLOT = 'min-w-16 shrink-0 text-right *:whitespace-nowrap' // floor keeps footer lanes aligned

/** Footer row classes screens align extra stats under. */

export interface MemeCardProps {
  model: MemeCardModel
  /** Tier / reshare line between the title and the stats row (`MemeDetailScreen`). */
  subTitle?: ReactNode | undefined
  footer?: ReactNode | undefined
  /** Right footer lane; replaces the market listing pair when set. */
  footerRight?: ReactNode | undefined
  /** `lg` is detail hero only (`MemeDetailScreen`). */
  size?: MemeCardSize | null | undefined
  /** Detail hero only: the card title is the page's H1. */
  titleAs?: 'h1' | undefined
  /** Replaces detail navigation with the enclosing dialog's artwork trigger. */
  enlargeLabel?: string | undefined
}

export function MemeCard({
  model,
  subTitle,
  footer,
  footerRight,
  size,
  titleAs,
  enlargeLabel,
}: MemeCardProps) {
  const scale = size ?? 'default'
  const TitleTag = titleAs === 'h1' ? 'h1' : 'span'
  const art = (
    <>
      <img
        data-slot="meme-art-backdrop"
        className={ART_BACKDROP}
        {...model.media.backdropImageProps}
      />
      {model.media.kind === 'video' ? (
        <video data-slot="meme-art" className={ART} {...model.media.videoProps} />
      ) : (
        <img data-slot="meme-art" className={ART} {...model.media.imageProps} />
      )}
    </>
  )
  return (
    <FoilCard
      as="article"
      ref={model.cardRef}
      tierKey={model.tierKey}
      presentation="collectible"
      data-slot="meme-card"
      data-size={scale}
      className={cn(memeCardVariants({ size: scale }))}
      aria-labelledby={model.titleId}
      data-media-autoplay={model.mediaAutoplay}
    >
      <div data-slot="meme-card-inner" className={INNER}>
        <FoilMedia
          presentation="collectible"
          seal={<TierSeal tierKey={model.tierKey} label={model.tierLabel} />}
        >
          {enlargeLabel ? (
            <DialogTrigger
              data-slot="collectible-art-enlarge"
              aria-label={enlargeLabel}
              className="block size-full cursor-zoom-in"
            >
              {art}
            </DialogTrigger>
          ) : (
            <Link
              {...model.detailLinkProps}
              data-slot="collectible-art-link"
              className="block size-full focus-visible:outline-none"
            >
              {art}
            </Link>
          )}
        </FoilMedia>
        <div data-slot="meme-meta" className={cn(memeMetaVariants({ size: scale }))}>
          <TitleTag
            data-slot="meme-title"
            className={cn(memeTitleVariants({ size: scale }))}
            id={model.titleId}
          >
            {model.title}
          </TitleTag>
          {subTitle}
          <span data-slot="meme-kicker" className={KICKER}>
            <span data-slot="meme-tier-name" className={TIER_NAME} aria-hidden="true">
              {model.tierName}
            </span>
            <span data-slot="meme-stats" className={STATS}>
              <span aria-hidden="true" className="inline-flex items-center gap-0.5">
                {model.viewsLabel !== null && (
                  <>
                    <Icon name="eye" size={14} /> {model.viewsLabel} ·{' '}
                  </>
                )}
                <Icon name="arrows-left-right" size={14} /> {model.resharesLabel}
              </span>
              <span className="sr-only">{model.statsA11yLabel}</span>
            </span>
          </span>
          <span data-slot="meme-sub" className={cn(memeSubVariants({ size: scale }))}>
            <span className={VALUE}>
              <span aria-hidden="true" className="inline-flex items-center gap-0.5">
                <Icon name="brain" size={14} /> {model.valueLabel}
              </span>
              <span className="sr-only">{model.valueA11yLabel}</span>
            </span>
            {footerRight ? (
              <span data-slot="meme-card-footer-right" className={RIGHT_SLOT}>
                {footerRight}
              </span>
            ) : model.listing ? (
              <span data-slot="for-sale" className={RIGHT_SLOT}>
                <span aria-hidden="true">
                  <span className="block">{model.listing.sharesLabel}</span>
                  <span className="block">{model.listing.forSaleLabel}</span>
                </span>
                <span className="sr-only">{model.listing.sharesA11yLabel}</span>
              </span>
            ) : null}
          </span>
          {footer}
        </div>
      </div>
    </FoilCard>
  )
}

export { memeCardVariants }
