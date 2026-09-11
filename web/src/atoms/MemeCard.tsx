import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { glowStyleFor } from '../../../shared/tiers'
import { cn } from '../lib/cn'
import type { MemeCardModel } from '../lib/memeCardModel'
import { tierClasses, tierFrameClasses } from './foil'
import { TierChip } from './TierChip'
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

/* The card: a raised surface, 8px of padding around the art, radius 25 (`components.md` › MemeCard).
   The tier does not colour this box — the frame inside it does — so the surface is a plain utility,
   which also outranks the legacy `.tier-<key>` padding-frame background (`utilities` ranks after
   `components`). */
const CARD = cn(
  'group relative isolate rounded-card bg-surface p-2 shadow-raised',
  /* the card answers its own width, not the window's: a 166px thumb wears the phone scale whether
     it is in a 2-up phone grid, a memeplex strip or a 1440px marketplace */
  '@container',
  'transition-transform duration-(--dur-base) ease-[ease] motion-reduce:transition-none',
  /* touch has no hover to lift on, so it answers a press instead — both sizes, as the sheet does */
  'pointer-coarse:active:scale-[0.99]',
  /* focus lives on the outer card, outside the frame's clip, and wears the global focus ring */
  'has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-focus',
  'has-[a:focus-visible]:outline-offset-2',
)

/* The hover lift is the grid thumb's alone: a detail hero is already the page's subject and has
   nowhere to lift to. */
const CARD_LIFT = cn(
  '[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.01]',
  'motion-reduce:hover:translate-y-0! motion-reduce:hover:scale-100!',
)

const INNER = 'relative flex h-full flex-col'

/* The image frame: radius 18, its own surface, and the 3px tier border `atoms/foil.css` paints on
   `.foil-frame` (a real border, so `overflow-hidden` clips the art to its inner radius). `foil-media`
   is the second half of the effect API — it bounds the sheen and the sparkle to the art. */
const FRAME = 'foil-frame foil-media relative rounded-field bg-surface-pressed'

const ART = 'block w-full bg-surface-pressed'

/* pause / play for the card film: a raised 32px square pinned to the art's corner, state carried by
   aria-pressed. */
const TOGGLE = cn(
  'absolute right-2 bottom-2 z-[2] inline-flex items-center justify-center',
  'size-8 p-0 pointer-coarse:size-11',
  'cursor-pointer whitespace-nowrap text-label leading-none text-ink',
  'rounded-[12px] bg-surface-raised shadow-raised',
  '[transition:transform_var(--dur-fast)_ease,background_var(--dur-base)_ease]',
  'motion-reduce:transition-none',
  '[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px',
  'motion-reduce:hover:translate-y-0!',
  'pointer-coarse:active:translate-y-px active:shadow-pressed',
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2',
  'forced-colors:focus-visible:outline-[Highlight]',
)

/* The listing state, not a listing control: the one pill on the art says a card is for sale, and it
   is the only thing on a card allowed to wear the action colour (a card carries no primary button,
   so the one-bubblegum rule is untouched). */
const FOR_SALE = cn(
  'absolute top-2 right-2 z-[2] inline-flex h-[25px] items-center rounded-pill px-2.5',
  'bg-action text-micro font-bold text-on-action shadow-raised',
)

/* The tier chip sits 16 in from the frame's bottom-left corner, as the board draws it. */
const CHIP_POS = 'absolute bottom-4 left-4 z-[2]'

const META = 'flex flex-col'

const TITLE = 'font-display font-medium tracking-card-title text-ink'

/* the emoji stat line: 👁️ views · 🔁 reshares, 12/18 on ink-muted */
const STATS = 'flex items-center text-micro/[18px] text-ink-muted tabular-nums'

/* The footer row: braincells on the left, a 64px right-aligned slot on the right that is allowed
   two lines ("10 sh @ 🧠3", "12/100 shares"). On a card narrower than 220px it wraps instead. */
const SUB = cn(
  'flex items-start justify-between gap-2 text-micro/[15px] font-medium text-ink tabular-nums',
  '@max-[220px]:flex-wrap @max-[220px]:gap-y-0.5',
)

const VALUE = 'text-small/[18px] font-bold text-ink'

const RIGHT_SLOT = 'w-16 shrink-0 text-right'

/* The two card scales, spelled out per element:
     `lg` — the detail hero: contained art (a wide two-panel joke letterboxes on the media plate
     rather than having its caption cropped away), a wrapping title, a 13px chip, roomier meta and
     no hover lift. Grid thumbs keep `cover` — those crops are deliberate — and clamp the title to
     two lines so a 166px phone card keeps its stats on screen; under 220px of card the thumb takes
     the phone scale (square art, 17/21 title), which is the board's iPhone card. */
const SIZES: Record<MemeCardSize, Record<'card' | 'art' | 'meta' | 'title', string>> = {
  default: {
    card: CARD_LIFT,
    art: 'aspect-[340/228] object-cover @max-[220px]:aspect-square',
    meta: 'gap-1 px-1.5 pt-3.5 pb-1.5 @max-[220px]:pt-2.5',
    title: 'line-clamp-2 text-card-title @max-[220px]:text-card-title-phone',
  },
  lg: {
    card: '',
    art: 'aspect-[340/228] object-contain',
    meta: 'gap-1.5 px-2 pt-4 pb-2',
    title: 'text-card-title',
  },
}

/**
 * The meta row a `footer` has to line up with: `BinderScreen` and `ProfileScreen` add their own
 * stats line under the card's, and it has to be the same row this atom already paints.
 */
export const memeCardSubClasses = SUB

export interface MemeCardProps {
  model: MemeCardModel
  /** extra meta rows under the stats — a buy button, a binder tag, a quest hint */
  footer?: ReactNode | undefined
  /**
   * `default` (the grid thumb) or `lg`, the detail-page hero: contained art, a wrapping title, a
   * bigger tier chip, roomier meta and no hover lift. `screens/MemeDetailScreen.tsx` is the only
   * `lg` caller.
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
      className={cn(CARD, scale.card, tierFrameClasses(model.tierKey))}
      aria-labelledby={model.titleId}
      data-glow-style={glowStyleFor(model.tierKey)}
      data-media-autoplay={model.mediaAutoplay}
    >
      <div data-slot="meme-card-inner" className={INNER}>
        <span data-slot="foil-media" className={FRAME}>
          <Link {...model.detailLinkProps} className="block focus-visible:outline-none">
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
          <TierChip
            tierKey={model.tierKey}
            label={model.tierName}
            size={size === 'lg' ? 'md' : 'sm'}
            className={CHIP_POS}
          />
          {model.listing && (
            <span data-slot="for-sale" className={FOR_SALE}>
              {model.listing.forSaleLabel}
            </span>
          )}
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
            {model.listing && (
              <span className={RIGHT_SLOT}>
                <span aria-hidden="true">{model.listing.sharesLabel}</span>
                <span className="sr-only">{model.listing.sharesA11yLabel}</span>
              </span>
            )}
          </span>
          {footer}
        </div>
      </div>
    </article>
  )
}
