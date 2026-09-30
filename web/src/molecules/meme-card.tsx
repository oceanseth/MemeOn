import { cva, type VariantProps } from 'class-variance-authority'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { MemeCardModel } from '../lib/memeCardModel'
import { FoilCard, FoilMedia } from '@/atoms/foil-frame'
import { Icon } from '@/atoms/icon'
import { DialogTrigger } from '@/atoms/dialog'

/* The card is a masonry citizen: its art window carries the meme's own ratio (`--meme-aspect`,
   read by `atoms/foil.css`) and the art covers it edge to edge, and the meta below is three
   fixed-height lines on one rhythm — title, then two label-left / figures-right rows: tier
   against the view and reshare stats, value against the listing badge — so a card's full height
   is arithmetic (`lib/masonry.ts`), never measured. Its focus ring follows the artwork's
   navigation link or enlargement button. */
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

const memeTitleVariants = cva('m-0 text-foreground', {
  variants: {
    size: {
      /** exactly one line (26px at text-lg): masonry heights are arithmetic, so nothing reserves.
       *  The grid title is the text face at 500 — Unbounded's stems read as bold at thumb size,
       *  and a feed of bolds has no loud voice left for the page's own headings. */
      default: 'h-6.5 truncate font-sans text-lg font-medium',
      lg: 'font-display font-normal text-3xl',
    },
  },
  defaultVariants: { size: 'default' },
})

/* the first meta row: the tier eyebrow left, the view and reshare figures right */
const memeKickerVariants = cva(
  'flex items-center justify-between gap-2 overflow-hidden text-muted-foreground',
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

/* the second meta row on the same lanes: the braincell value left, the listing badge (or the
   screen's own right figure) right; `items-baseline` seats the sm value beside the xs badge */
const memeSubVariants = cva(
  'flex items-baseline justify-between gap-2 overflow-hidden text-muted-foreground',
  {
    variants: {
      size: {
        default: 'h-5 text-xs',
        lg: 'h-6 text-sm',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

/** `default` grid thumb · `lg` detail hero. */
export type MemeCardSize = NonNullable<VariantProps<typeof memeCardVariants>['size']>

const INNER = cn('relative flex h-full flex-col')

/* the window already has the art's ratio, so `cover` fills it without cropping (past the clamp it
   centre-crops); the size and position are `atoms/foil.css`'s */
const ART = cn('block object-cover')

/* the tier name is set in caps: it takes the caps tracking the other two eyebrows wear */
const TIER_NAME = cn('font-semibold whitespace-nowrap tracking-wider text-foreground uppercase')

/* the card's key figure sits one text step above its row */
const memeValueVariants = cva('font-semibold text-foreground', {
  variants: {
    size: {
      default: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: { size: 'default' },
})

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
  const art =
    model.media.kind === 'video' ? (
      <video data-slot="meme-art" className={ART} {...model.media.videoProps} />
    ) : (
      <img data-slot="meme-art" className={ART} {...model.media.imageProps} />
    )
  return (
    <FoilCard
      as="article"
      ref={model.cardRef}
      tierKey={model.tierKey}
      presentation="collectible"
      data-slot="meme-card"
      data-size={scale}
      style={{ '--meme-aspect': model.aspect ?? undefined } as CSSProperties}
      className={cn(memeCardVariants({ size: scale }))}
      aria-labelledby={model.titleId}
      data-media-autoplay={model.mediaAutoplay}
    >
      <div data-slot="meme-card-inner" className={INNER}>
        <FoilMedia presentation="collectible">
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
            <span data-slot="meme-tier-name" className={TIER_NAME} aria-hidden="true">
              {model.tierName}
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
            </span>
          </span>
          <span data-slot="meme-sub" className={cn(memeSubVariants({ size: scale }))}>
            <span data-slot="meme-value" className={cn(memeValueVariants({ size: scale }))}>
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
                <span aria-hidden="true">{model.listing.badgeLabel}</span>
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
