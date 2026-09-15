import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { glowStyleFor } from '@memeon/shared/tiers'
import { cn } from '../lib/cn'
import type { MemeCardModel } from '../lib/memeCardModel'
import { tierFrameClasses } from '@/atoms/foil'
import { TierChip } from '@/atoms/tier-chip'
import './foil.css'

/** `default` grid thumb · `lg` detail hero. */
export type MemeCardSize = 'default' | 'lg'

const CARD = cn(
  'group relative isolate self-start rounded-lg material-card p-2',
  '@container',
  'transition-lift',
  'pointer-coarse:active:scale-99',
  'has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-ring',
  'has-[a:focus-visible]:outline-offset-2',
  'contrast-more:has-[a:focus-visible]:outline-4',
  'forced-colors:has-[a:focus-visible]:outline-fc-highlight',
)

const CARD_LIFT = cn(
  'pointer-fine:hover:-translate-y-1',
  'pointer-fine:hover:scale-101',
  'motion-reduce:hover:translate-y-0! motion-reduce:hover:scale-100!',
)

const INNER = 'relative flex h-full flex-col'

const FRAME = 'foil-frame foil-media relative rounded-md bg-muted'

const ART = 'block aspect-square w-full bg-muted object-contain'

const TOGGLE = cn(
  'absolute right-2 bottom-2 z-[2] inline-flex items-center justify-center',
  'size-8 p-0 pointer-coarse:size-hit',
  'cursor-pointer whitespace-nowrap text-label leading-none text-foreground',
  'rounded-sm material-raised',
  'transition-press',
  'lift press',
  'focus-ring',
)

const CHIP_POS = 'absolute bottom-4 left-4 z-[2]'

const META = 'flex flex-col'

const TITLE = 'font-display font-medium tracking-card-title text-foreground'

const TITLE_HERO = 'text-title tracking-title'

const STATS = 'flex items-center text-micro/normal text-muted-foreground tabular-nums'

const SUB = cn(
  'flex items-start justify-between gap-2 text-micro/tight font-medium text-foreground tabular-nums',
  '@max-card-narrow:flex-wrap @max-card-narrow:gap-y-0.5',
)

const VALUE = 'text-small font-bold text-foreground'

const RIGHT_SLOT = 'min-w-16 shrink-0 text-right [&>span]:whitespace-nowrap' // floor keeps footer lanes aligned

const SIZES: Record<MemeCardSize, Record<'card' | 'meta' | 'title', string>> = {
  default: {
    card: CARD_LIFT,
    meta: 'gap-1 px-1.5 pt-3.5 pb-1.5 @max-card-narrow:pt-2.5',
    title: 'line-clamp-2 text-card-title @max-card-narrow:text-card-title-phone',
  },
  lg: {
    card: '',
    meta: 'gap-1.5 px-2 pt-4 pb-2',
    title: TITLE_HERO,
  },
}

/** Footer row classes screens align extra stats under. */
export const memeCardSubClasses = SUB

export interface MemeCardProps {
  model: MemeCardModel
  /** Tier / reshare line between the title and the stats row (`MemeDetailScreen`). */
  subTitle?: ReactNode | undefined
  footer?: ReactNode | undefined
  /** Right footer lane; replaces the market listing pair when set. */
  footerRight?: ReactNode | undefined
  /** `lg` is detail hero only (`MemeDetailScreen`). */
  size?: MemeCardSize | undefined
}

export function MemeCard({ model, subTitle, footer, footerRight, size = 'default' }: MemeCardProps) {
  const scale = SIZES[size]
  return (
    <article
      ref={model.cardRef}
      data-slot="meme-card"
      data-size={size}
      className={cn(CARD, scale.card, tierFrameClasses(model.tierKey))}
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
            size={size === 'lg' ? 'md' : 'sm'}
            className={CHIP_POS}
          />
          {model.media.kind === 'video' && (
            <button data-slot="media-toggle" className={TOGGLE} {...model.media.toggleProps}>
              <span aria-hidden="true">⏯</span>
            </button>
          )}
        </span>
        <div data-slot="meme-meta" className={cn(META, scale.meta)}>
          <span data-slot="meme-title" className={cn(TITLE, scale.title)} id={model.titleId}>
            {model.title}
          </span>
          {subTitle}
          <span data-slot="meme-stats" className={STATS}>
            <span aria-hidden="true">
              {model.viewsLabel !== null && <>👁️ {model.viewsLabel} · </>}🔁{' '}
              {model.resharesLabel}
            </span>
            <span className="sr-only">{model.statsA11yLabel}</span>
          </span>
          <span data-slot="meme-sub" className={SUB}>
            <span className={VALUE}>
              <span aria-hidden="true">🧠 {model.valueLabel}</span>
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
