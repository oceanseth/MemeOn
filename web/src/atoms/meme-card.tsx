import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { glowStyleFor } from '@memeon/shared/tiers'
import { cn } from '@/lib/cn'
import type { MemeCardModel } from '../lib/memeCardModel'
import { tierFrameClasses } from '@/atoms/foil'
import { TierChip } from '@/atoms/tier-chip'
import { Icon } from '@/atoms/icon'
import './foil.css'

/* The card is a container for its own meta row (`@max-card-narrow:` fires under 220px). The ring
   is the card's, for the link inside it: `has-[a:focus-visible]` rather than `focus-ring`, because
   the focused element is the art link and the toggle keeps its own ring.
   Every card in a grid is the same size: the track sets the width, and the height is the same by
   construction — the title reserves its two lines and the value row reserves the two-line listing
   slot — so the card is left free to stretch to its track (no `self-start`) and a screen's own
   per-card footer cannot make a row ragged either. */
const memeCardVariants = cva(
  [
    'group relative isolate rounded-lg material-card p-2',
    '@container',
    'transition-lift',
    'pointer-coarse:active:scale-99',
    'has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-ring',
    'has-[a:focus-visible]:outline-offset-2',
    'contrast-more:has-[a:focus-visible]:outline-4',
    'forced-colors:has-[a:focus-visible]:outline-fc-highlight',
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
      default: 'gap-1 px-1.5 pt-3.5 pb-1.5 @max-card-narrow:pt-2.5',
      lg: 'gap-1.5 px-2 pt-4 pb-2',
    },
  },
  defaultVariants: { size: 'default' },
})

const memeTitleVariants = cva('font-display font-normal text-foreground', {
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

const INNER = 'relative flex h-full flex-col'

const FRAME = 'foil-frame foil-media relative rounded-md bg-muted'

const ART = 'block aspect-square w-full bg-muted object-contain'

/* 32px raised square over the art's corner; the coarse-pointer form is the full 44px target */
const TOGGLE = cn(
  'absolute right-2 bottom-2 z-2 inline-flex items-center justify-center',
  'size-8 p-0 pointer-coarse:size-11',
  'cursor-pointer whitespace-nowrap text-base leading-none text-foreground',
  'rounded-sm material-raised',
  'transition-press',
  'lift press',
  'focus-ring',
)

const CHIP_POS = 'absolute bottom-4 left-4 z-2'

const STATS = 'flex items-center text-xs text-muted-foreground tabular-nums'

/* the grid thumb reserves the two-line listing slot (2 × 16) whether or not it is for sale; the
   narrow form may wrap its right lane under the value (20 + 2 + 16), and reserves that instead */
const memeSubVariants = cva(
  [
    'flex items-start justify-between gap-2 text-xs font-medium text-foreground tabular-nums',
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
}

export function MemeCard({ model, subTitle, footer, footerRight, size }: MemeCardProps) {
  const scale = size ?? 'default'
  return (
    <article
      ref={model.cardRef}
      data-slot="meme-card"
      data-size={scale}
      className={cn(memeCardVariants({ size: scale }), tierFrameClasses(model.tierKey))}
      aria-labelledby={model.titleId}
      data-glow-style={glowStyleFor(model.tierKey)}
      data-media-autoplay={model.mediaAutoplay}
    >
      <div data-slot="meme-card-inner" className={INNER}>
        <span data-slot="foil-media" className={FRAME}>
          <Link {...model.detailLinkProps} className="block focus-visible:outline-none">
            {model.media.kind === 'video' ? (
              <video data-slot="meme-art" className={ART} {...model.media.videoProps} />
            ) : (
              <img data-slot="meme-art" className={ART} {...model.media.imageProps} />
            )}
          </Link>
          <TierChip
            tierKey={model.tierKey}
            label={model.tierName}
            size={scale === 'lg' ? 'md' : 'sm'}
            className={CHIP_POS}
          />
          {model.media.kind === 'video' && (
            <button data-slot="media-toggle" className={TOGGLE} {...model.media.toggleProps}>
              <span aria-hidden="true">
                <Icon name="square-play" size={20} />
              </span>
            </button>
          )}
        </span>
        <div data-slot="meme-meta" className={cn(memeMetaVariants({ size: scale }))}>
          <span data-slot="meme-title" className={cn(memeTitleVariants({ size: scale }))} id={model.titleId}>
            {model.title}
          </span>
          {subTitle}
          <span data-slot="meme-stats" className={STATS}>
            <span aria-hidden="true" className="inline-flex items-center gap-0.5">
                            {model.viewsLabel !== null && (
                              <>
                                <Icon name="eye" size={14} /> {model.viewsLabel} ·{' '}
                              </>
                            )}
                            <Icon name="refresh-cw" size={14} /> {model.resharesLabel}
                          </span>
            <span className="sr-only">{model.statsA11yLabel}</span>
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
    </article>
  )
}

export { memeCardVariants }
