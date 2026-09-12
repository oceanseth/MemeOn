import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { glowStyleFor } from '@memeon/shared/tiers'
import { cn } from '../lib/cn'
import { FOCUS_RING } from '../lib/focus'
import type { MemeCardModel } from '../lib/memeCardModel'
import { tierFrameClasses } from './foil'
import { TierChip } from './TierChip'
import './foil.css'

/** `default` grid thumb · `lg` detail hero. */
export type MemeCardSize = 'default' | 'lg'

const CARD = cn(
  'group relative isolate self-start rounded-card bg-surface p-2 shadow-raised',
  '@container',
  'transition-transform duration-(--dur-base) ease-[ease] motion-reduce:transition-none',
  'pointer-coarse:active:scale-[0.99]',
  'has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-focus',
  'has-[a:focus-visible]:outline-offset-2',
  'contrast-more:has-[a:focus-visible]:outline-4',
  'forced-colors:has-[a:focus-visible]:outline-[Highlight]',
)

const CARD_LIFT = cn(
  '[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.01]',
  'motion-reduce:hover:translate-y-0! motion-reduce:hover:scale-100!',
)

const INNER = 'relative flex h-full flex-col'

const FRAME = 'foil-frame foil-media relative rounded-field bg-surface-pressed'

const ART = 'block aspect-square w-full bg-surface-pressed object-contain'

const TOGGLE = cn(
  'absolute right-2 bottom-2 z-[2] inline-flex items-center justify-center',
  'size-8 p-0 pointer-coarse:size-11',
  'cursor-pointer whitespace-nowrap text-label leading-none text-ink',
  'rounded-chip bg-surface-raised shadow-raised',
  '[transition:transform_var(--dur-fast)_ease,background_var(--dur-base)_ease]',
  'motion-reduce:transition-none',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px',
  'motion-reduce:hover:translate-y-0!',
  'pointer-coarse:active:translate-y-px active:shadow-pressed',
  FOCUS_RING,
)

const CHIP_POS = 'absolute bottom-4 left-4 z-[2]'

const META = 'flex flex-col'

const TITLE = 'font-display font-medium tracking-card-title text-ink'

const TITLE_HERO = 'text-title tracking-title'

const STATS = 'flex items-center text-micro/[18px] text-ink-muted tabular-nums'

const SUB = cn(
  'flex items-start justify-between gap-2 text-micro/[15px] font-medium text-ink tabular-nums',
  '@max-[220px]:flex-wrap @max-[220px]:gap-y-0.5',
)

const VALUE = 'text-small/[18px] font-bold text-ink'

const RIGHT_SLOT = 'min-w-16 shrink-0 text-right [&>span]:whitespace-nowrap' // floor keeps footer lanes aligned

const SIZES: Record<MemeCardSize, Record<'card' | 'meta' | 'title', string>> = {
  default: {
    card: CARD_LIFT,
    meta: 'gap-1 px-1.5 pt-3.5 pb-1.5 @max-[220px]:pt-2.5',
    title: 'line-clamp-2 text-card-title @max-[220px]:text-card-title-phone',
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
  footer?: ReactNode | undefined
  /** Right footer lane; replaces the market listing pair when set. */
  footerRight?: ReactNode | undefined
  /** `lg` is detail hero only (`MemeDetailScreen`). */
  size?: MemeCardSize | undefined
}

export function MemeCard({ model, footer, footerRight, size = 'default' }: MemeCardProps) {
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
