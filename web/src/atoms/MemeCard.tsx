import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { glowStyleFor } from '../../../shared/tiers'
import { cn } from '../lib/cn'
import type { MemeCardModel } from '../lib/memeCardModel'
import { Badge } from './Badge'
import { tierClasses } from './foil'
import './foil.css'

/**
 * Re-exported from the dependency-free `atoms/foil` module for compatibility: this atom used to
 * own `tierClasses` outright, and every existing caller still imports it as `MemeCard`'s export.
 * `atoms/foil.ts` is the module a code-split route should reach for instead, since it carries no
 * React import.
 */
export { tierClasses }

/** `default` is the grid thumb; `lg` is the detail-page hero. See {@link MemeCardProps.size}. */
export type MemeCardSize = 'default' | 'lg'

/* The frame. `overflow-visible` and `isolate` are the glow ring's own base, restated here as
   utilities because `foil.css` keeps that base at `:where()` zero specificity for its other
   hosts; `relative` and the 3px `--glow-width` padding are the card's. The background is *not* a
   utility — a `bg-*` class would out-cascade every `.tier-*` frame. */
const CARD = cn(
  'group relative isolate overflow-visible rounded-card p-(--glow-width)',
  'transition-transform duration-(--dur-base) ease-[ease] motion-reduce:transition-none',
  /* touch has no hover to lift on, so it answers a press instead — both sizes, as the sheet does */
  'pointer-coarse:active:scale-[0.99]',
  /* focus lives on the outer card, outside the clip, keyed off --color-text so it survives every
     tier; the dark halo separates it from a light foil frame */
  'has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-text',
  'has-[a:focus-visible]:outline-offset-[3px]',
  'has-[a:focus-visible]:shadow-[0_0_0_5px_rgba(0,0,0,0.7)]',
)

/* The hover lift is the grid thumb's alone: a detail hero is already the page's subject and has
   nowhere to lift to. */
const CARD_LIFT = cn(
  '[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.01]',
  'motion-reduce:hover:translate-y-0! motion-reduce:hover:scale-100!',
)

const INNER = cn(
  'relative flex h-full flex-col overflow-hidden [contain:paint]',
  'rounded-[calc(var(--radius-card)_-_var(--glow-width))] bg-bg-card',
  /* the hover lift is gone under reduced motion, so the hover state says so without moving */
  'motion-reduce:group-hover:outline-1 motion-reduce:group-hover:outline-accent',
  'motion-reduce:group-hover:outline-offset-[-1px]',
)

const ART = 'block aspect-square w-full bg-bg-media'

/* pause / play for the card film: a scrim chip pinned to the art corner, state carried by
   aria-pressed. The chrome the legacy `button` rule used to lend it is spelled out here. */
const TOGGLE = cn(
  'absolute right-2 bottom-2 z-[3] inline-flex items-center justify-center',
  'min-h-8 min-w-8 p-0 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
  'cursor-pointer whitespace-nowrap text-sm leading-none text-text',
  'rounded-pill border border-border bg-[color-mix(in_srgb,var(--color-bg)_72%,transparent)]',
  'backdrop-blur-[4px]',
  '[transition:transform_var(--dur-fast)_ease,border-color_var(--dur-base)_ease,background_var(--dur-base)_ease]',
  'motion-reduce:transition-none',
  'hover:border-(--state-hover-border)',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px',
  'motion-reduce:hover:translate-y-0!',
  'pointer-coarse:active:translate-y-px',
  'focus-visible:outline-2 focus-visible:outline-(--focus-ring)',
  'focus-visible:outline-offset-(--focus-offset)',
  'contrast-more:focus-visible:outline-3 forced-colors:focus-visible:outline-[Highlight]',
)

const META = 'flex flex-col'

const TITLE = 'overflow-hidden text-ellipsis font-bold text-text'

/* the rarity is product language: on a 169px 2-up card it wraps to a second line rather than
   being clipped mid-word by the inner's overflow */
const CHIP = cn(
  'inline-flex max-w-full items-center gap-[5px] rounded-pill border border-current',
  'bg-[rgba(0,0,0,0.45)] text-center font-extrabold uppercase',
  'tracking-[0.8px] [overflow-wrap:anywhere] text-(color:--tier)',
)

/* counts that tick or sit in columns align on fixed-width figures; under 561px the row wraps
   rather than squeezing the two halves together. */
const SUB = cn(
  'flex items-center justify-between gap-2 text-text-dim tabular-nums',
  'max-sm:flex-wrap max-sm:gap-y-0.5',
)

/* The two card scales, spelled out per element:
     `lg` — art `object-fit: contain` · title 22px, wrapping · meta 14/16/16 with a 9px gap ·
     sub 15px · chip 13px / 4px 12px · no hover lift.
   `text-xs/[1.5]` on the default sub, not a bare `text-xs`: Tailwind's paired 1rem line-height
   would shave 2px off every row. `text-[15px]` sets none of its own, so `lg` inherits the 1.5. */
const SIZES: Record<MemeCardSize, Record<'card' | 'art' | 'meta' | 'title' | 'chip' | 'sub', string>> = {
  default: {
    card: CARD_LIFT,
    art: 'object-cover',
    meta: 'gap-1.5 px-3 pt-2.5 pb-3',
    title: 'whitespace-nowrap text-[15px]',
    chip: 'px-[9px] py-[3px] text-[11px]',
    sub: 'text-xs/[1.5]',
  },
  lg: {
    card: '',
    /* the hero is the meme itself: a wide two-panel joke letterboxes on the media plate rather
       than having its caption cropped away. Grid thumbs keep `cover` — those crops are deliberate. */
    art: 'object-contain',
    meta: 'gap-[9px] px-4 pt-3.5 pb-4',
    title: 'whitespace-normal text-[22px]',
    chip: 'px-3 py-1 text-[13px]',
    sub: 'text-[15px]',
  },
}

/**
 * The meta row a `footer` has to line up with: `BinderScreen` and `ProfileScreen` add their own
 * stats line under the card's, and it has to be the same row this atom already paints.
 */
export const memeCardSubClasses = cn(SUB, SIZES.default.sub)

export interface MemeCardProps {
  model: MemeCardModel
  /** extra meta rows under the stats — a buy button, a binder tag, a quest hint */
  footer?: ReactNode | undefined
  /**
   * `default` (the grid thumb) or `lg`, the detail-page hero: contained art, a 22px wrapping
   * title, roomier meta and no hover lift. `screens/MemeDetailScreen.tsx` is the only `lg` caller.
   */
  size?: MemeCardSize | undefined
}

export function MemeCard({ model, footer, size = 'default' }: MemeCardProps) {
  const scale = SIZES[size]
  return (
    <article
      ref={model.cardRef}
      data-slot="meme-card"
      data-size={size}
      className={cn(CARD, scale.card, tierClasses(model.tierKey))}
      aria-labelledby={model.titleId}
      data-glow-style={glowStyleFor(model.tierKey)}
      data-media-autoplay={model.mediaAutoplay}
    >
      <div data-slot="meme-card-inner" className={INNER}>
        {/* .foil-media bounds the sheen and the sparkle to the art, so neither sweeps the meta text */}
        <span data-slot="foil-media" className="foil-media">
          <Link {...model.detailLinkProps} className="focus-visible:outline-none">
            {model.media.kind === 'video' ? (
              <video
                data-slot="meme-art"
                className={cn(ART, scale.art)}
                {...model.media.videoProps}
              />
            ) : (
              <img data-slot="meme-art" className={cn(ART, scale.art)} {...model.media.imageProps} />
            )}
          </Link>
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
          <span>
            <span
              data-slot="tier-chip"
              className={cn(CHIP, scale.chip)}
              style={{ '--tier': model.tierColor } as CSSProperties}
            >
              {model.tierLabel}
            </span>
          </span>
          <span data-slot="meme-sub" className={cn(SUB, scale.sub)}>
            <span>
              <span aria-hidden="true">
                {model.viewsLabel !== null && <>👁️ {model.viewsLabel} · </>}🔁{' '}
                {model.resharesLabel}
              </span>
              <span className="sr-only">{model.statsA11yLabel}</span>
            </span>
            <span>
              <span aria-hidden="true">🧠 {model.valueLabel}</span>
              <span className="sr-only">{model.valueA11yLabel}</span>
            </span>
          </span>
          {model.listing && (
            <span data-slot="meme-sub" className={cn(SUB, scale.sub)}>
              <Badge>for sale</Badge>
              <span aria-hidden="true">{model.listing.sharesLabel}</span>
              <span className="sr-only">{model.listing.sharesA11yLabel}</span>
            </span>
          )}
          {footer}
        </div>
      </div>
    </article>
  )
}
