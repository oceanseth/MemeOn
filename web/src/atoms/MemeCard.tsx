import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { glowStyleFor } from '../../../shared/tiers'
import { cn } from '../lib/cn'
import { FOCUS_RING } from '../lib/focus'
import type { MemeCardModel } from '../lib/memeCardModel'
import { tierFrameClasses } from './foil'
import { TierChip } from './TierChip'
import './foil.css'

/** `default` is the grid thumb; `lg` is the detail-page hero. See {@link MemeCardProps.size}. */
export type MemeCardSize = 'default' | 'lg'

/* The card: a raised surface, 8px of padding around the art, radius 25 (`components.md` › MemeCard).
   The tier does not colour this box — the frame inside it does — so the surface is a plain utility,
   which also outranks `.tier-<key>`'s own fallback background (`utilities` ranks after
   `components`). */
const CARD = cn(
  'group relative isolate self-start rounded-card bg-surface p-2 shadow-raised',
  /* the card answers its own width, not the window's: a 166px thumb wears the phone scale whether
     it is in a 2-up phone grid, a memeplex strip or a 1440px marketplace. `self-start` keeps a row
     of square thumbs from stretching if one neighbour wraps extra meta. */
  '@container',
  'transition-transform duration-(--dur-base) ease-[ease] motion-reduce:transition-none',
  /* touch has no hover to lift on, so it answers a press instead — both sizes, as the sheet does */
  'pointer-coarse:active:scale-[0.99]',
  /* focus lives on the outer card, outside the frame's clip, and wears the global focus ring —
     the whole contract, `lib/focus` rewritten onto the `has-[a:focus-visible]` variant */
  'has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-focus',
  'has-[a:focus-visible]:outline-offset-2',
  'contrast-more:has-[a:focus-visible]:outline-4',
  'forced-colors:has-[a:focus-visible]:outline-[Highlight]',
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

/* Pre-ox/ui plate: a square (`aspect-ratio: 1` on production `.meme-art`) so a 4-up 230px grid
   stays compact. `contain` is the one change from that era — cover was cropping captions off. */
const ART = 'block aspect-square w-full bg-surface-pressed object-contain'

/* pause / play for the card film: a raised 32px square pinned to the art's corner, state carried by
   aria-pressed. */
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

/* The tier chip sits 16 in from the frame's bottom-left corner, as the board draws it. */
const CHIP_POS = 'absolute bottom-4 left-4 z-[2]'

const META = 'flex flex-col'

const TITLE = 'font-display font-medium tracking-card-title text-ink'

/* Detail hero title: the `title` rung (27/34), one step above the grid thumb's card-title. */
const TITLE_HERO = 'text-title tracking-title'

/* the emoji stat line: 👁️ views · 🔁 reshares, 12/18 on ink-muted */
const STATS = 'flex items-center text-micro/[18px] text-ink-muted tabular-nums'

/* The footer row: braincells on the left, a 64px right-aligned slot on the right that is allowed
   two lines ("12 shares" / "for sale", or a screen's own "12/100 shares"). On a card narrower than
   220px it wraps instead. */
const SUB = cn(
  'flex items-start justify-between gap-2 text-micro/[15px] font-medium text-ink tabular-nums',
  '@max-[220px]:flex-wrap @max-[220px]:gap-y-0.5',
)

const VALUE = 'text-small/[18px] font-bold text-ink'

/* The board's 64px lane (`6Y7-0`, `78S-0`) as a floor rather than a cap: it draws "12 shares", and
   every card in the market lines up on it, but the product's own maximum is "100 shares", which
   breaks mid-phrase at exactly 64. A minimum keeps the lane and lets the one long case stay two
   lines instead of three. */
const RIGHT_SLOT = 'min-w-16 shrink-0 text-right [&>span]:whitespace-nowrap'

/* The two card scales, spelled out per element:
     `lg` — the detail hero: a wrapping 27/34 title, a 13px chip, roomier meta and no hover lift.
     Grid thumbs clamp the title to two lines so a 166px phone card keeps its stats on screen; under
     220px of card the thumb takes the phone type scale, which is the board's iPhone card.

     Art is a square contain plate at both sizes — the production card, not the Soft Press 340/228
     cover crop and not a full-bleed native-ratio stack. */
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
   * The right lane of the card's own footer row (`70L-0` › `73V-0`: `🧠 2,480` left, `12/100 shares`
   * right). Supplying it takes the lane over from the market's listing pair, which is what a binder
   * card wants: the board draws one footer row, not the listing lane with a second row stacked
   * under it.
   */
  footerRight?: ReactNode | undefined
  /**
   * `default` (the grid thumb) or `lg`, the detail-page hero: a wrapping title, a bigger tier chip,
   * roomier meta and no hover lift. Art is the same square contain plate at both sizes.
   * `screens/MemeDetailScreen.tsx` is the only `lg` caller.
   */
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
              /* the listing state lives here and nowhere else: the boards draw no pill on the art
                 (6UR-0 cards 6XT-0/6Y9-0/6YP-0, 70L-0's seven, 767-0's six) — it is the slot's
                 second line, so a card still wears no action colour at all */
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
