import { cva, type VariantProps } from 'class-variance-authority'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { MemeCardModel } from '../lib/memeCardModel'
import { FoilCard, FoilMedia } from '@/atoms/foil-frame'
import { Icon } from '@/atoms/icon'
import { TierSeal } from '@/atoms/tier-seal'
import { DialogTrigger } from '@/atoms/dialog'

/* The card is a masonry citizen: its art window carries the meme's clamped aspect
   (`--meme-aspect`, read by `atoms/foil.css`), and the meta below is two fixed-height lines —
   title, then tier · value on the left with stats and the listing badge on the right — so a
   card's full height is arithmetic (`lib/masonry.ts`), never measured. Its focus ring follows
   the artwork's navigation link or enlargement button. */
const memeCardVariants = cva(
  ['group relative isolate', 'transition-lift', 'pointer-coarse:active:scale-99', 'focus-ring-within'],
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
      default: 'gap-1 px-1 pt-3 pb-0',
      lg: 'gap-1.5 px-1.5 pt-4 pb-1',
    },
  },
  defaultVariants: { size: 'default' },
})

const memeTitleVariants = cva('m-0 font-display font-normal text-foreground', {
  variants: {
    size: {
      /** exactly one line (24px at text-xl): masonry heights are arithmetic, so nothing reserves */
      default: 'h-6 truncate text-xl',
      lg: 'text-3xl',
    },
  },
  defaultVariants: { size: 'default' },
})

/* the card's one meta row: tier · value left, stats and the listing badge right */
const memeKickerVariants = cva(
  'flex items-center justify-between gap-2 text-muted-foreground',
  {
    variants: {
      size: {
        default: 'h-4 text-xs',
        lg: 'h-5 text-sm',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

/** `default` grid thumb · `lg` detail hero. */
export type MemeCardSize = NonNullable<VariantProps<typeof memeCardVariants>['size']>

const INNER = cn('relative flex h-full flex-col')

const ART_BACKDROP =
  'absolute inset-0 z-0 block size-full scale-110 object-cover opacity-45 blur-lg saturate-125'

const ART_COVER = cn('block object-cover')

const ART_CONTAIN = cn('block object-contain')

const TIER_VALUE_LANE = 'flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap'

/* the tier name is set in caps: it takes the caps tracking the other two eyebrows wear */
const TIER_NAME = cn('font-semibold tracking-wider text-foreground uppercase')

const VALUE = 'font-semibold text-foreground'

const STATS_LANE = 'flex shrink-0 items-center gap-1.5'

const RIGHT_SLOT = 'whitespace-nowrap font-medium text-foreground'

export interface MemeCardProps {
  model: MemeCardModel
  /** Tier / reshare line between the title and the stats row (`MemeDetailScreen`). */
  subTitle?: ReactNode | undefined
  footer?: ReactNode | undefined
  /** Right lane of the meta row; replaces the listing badge when set. */
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
  const artClass = model.artFit === 'cover' ? ART_COVER : ART_CONTAIN
  const art = (
    <>
      {/* the blurred backdrop exists only to fill a letterboxed window */}
      {model.artFit === 'contain' && (
        <img
          data-slot="meme-art-backdrop"
          className={ART_BACKDROP}
          {...model.media.backdropImageProps}
        />
      )}
      {model.media.kind === 'video' ? (
        <video data-slot="meme-art" className={artClass} {...model.media.videoProps} />
      ) : (
        <img data-slot="meme-art" className={artClass} {...model.media.imageProps} />
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
      data-art-fit={model.artFit}
      style={{ '--meme-aspect': model.aspect } as CSSProperties}
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
              className="cursor-zoom-in"
            >
              {art}
            </DialogTrigger>
          ) : (
            <Link
              {...model.detailLinkProps}
              data-slot="collectible-art-link"
              className="focus-visible:outline-none"
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
          <span data-slot="meme-kicker" className={cn(memeKickerVariants({ size: scale }))}>
            <span data-slot="meme-tier-value" className={TIER_VALUE_LANE}>
              <span data-slot="meme-tier-name" className={TIER_NAME} aria-hidden="true">
                {model.tierName}
              </span>
              <span aria-hidden="true">·</span>
              <span data-slot="meme-value" className={VALUE}>
                <span aria-hidden="true" className="inline-flex items-center gap-0.5">
                  <Icon name="brain" size={14} /> {model.valueLabel}
                </span>
                <span className="sr-only">{model.valueA11yLabel}</span>
              </span>
            </span>
            <span data-slot="meme-stats" className={STATS_LANE}>
              <span aria-hidden="true" className="inline-flex items-center gap-0.5">
                {model.viewsLabel !== null && (
                  <>
                    <Icon name="eye" size={14} /> {model.viewsLabel} ·{' '}
                  </>
                )}
                <Icon name="arrows-left-right" size={14} /> {model.resharesLabel}
              </span>
              <span className="sr-only">{model.statsA11yLabel}</span>
              {footerRight ? (
                <span data-slot="meme-card-footer-right" className={RIGHT_SLOT}>
                  {footerRight}
                </span>
              ) : model.listing ? (
                <span data-slot="for-sale" className={RIGHT_SLOT}>
                  <span aria-hidden="true">{model.listing.badgeLabel}</span>
                  <span className="sr-only">{model.listing.sharesA11yLabel}</span>
                </span>
              ) : null}
            </span>
          </span>
          {footer}
        </div>
      </div>
    </FoilCard>
  )
}

export { memeCardVariants }
