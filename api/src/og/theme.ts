/**
 * The share card's palette: `web/src/index.css`'s dark arm and `web/src/atoms/foil.css`'s
 * foil stops, resolved to sRGB hex.
 *
 * Why literals and not the tokens: SVG 1.1 has no `oklch()`, no `light-dark()` and no custom
 * properties, so satori and resvg only ever see hex. A crawler card is always the dark arm —
 * it has no OS to ask. Every value below names the token it came from; when a token moves,
 * `api/scripts/check-og-palette.mjs` fails and this file is the one place to change.
 */
import type { GlowBorderStyle, Tier } from '@memeon/shared/tiers'

/** Semantic colours — `@theme static` in `web/src/index.css`, dark arm. */
export const COLOR = {
  background: '#0e0e19', // --color-background
  card: '#1b1b29', // --color-card
  accent: '#252435', // --color-accent
  foreground: '#edeef5', // --color-foreground
  mutedForeground: '#b8b8ce', // --color-muted-foreground
  border: '#45455d', // --color-border
  primary: '#74c9f9', // --color-primary
  primaryForeground: '#19182a', // --color-primary-foreground
  brand: '#b7b6f8', // --color-brand
  braincell: '#fab0d9', // --color-braincell
  ultraviolet700: '#5c26e1', // --ramp-ultraviolet-700
} as const

/** Type — `--font-display` / `--font-sans`. Unbounded never runs below 20px (see the type block). */
export const FONT = { display: 'Unbounded', sans: 'Onest' } as const

/**
 * A tier's foil, as satori can paint it. `foil.css` turns a conic ring around the card; a still
 * image has no rotation to give, so each sweep is the same stop set laid out on one diagonal —
 * the tier's frame colour opening and closing it, its highlights travelling through the middle.
 */
export interface Foil {
  /** the flat ring colour — `--tier-{key}-frame` */
  frame: string
  /** the ring itself, as a `linear-gradient()` */
  sweep: string
  /** the bloom behind the card — `--glow-bloom` at `--glow-opacity` */
  bloom: string
}

const FOIL: Record<GlowBorderStyle, Foil> = {
  'graphite-gradient-still': {
    frame: '#45455d',
    sweep: 'linear-gradient(120deg, #45455d 0%, #45455d 100%)',
    bloom: 'rgba(69, 69, 93, 0.10)',
  },
  'silver-highlight-still': {
    frame: '#b8b8ce',
    sweep: 'linear-gradient(120deg, #b8b8ce 0%, #b8b8ce 27%, #eef0f8 36%, #b8b8ce 47%, #b8b8ce 100%)',
    bloom: 'rgba(184, 184, 206, 0.22)',
  },
  'cyan-magenta-gradient-drift': {
    frame: '#8172f3',
    sweep:
      'linear-gradient(120deg, #8172f3 0%, #38cfff 13%, #8172f3 31%, #ff73db 56%, #8172f3 74%, #7fd4ff 89%, #8172f3 100%)',
    bloom: 'rgba(129, 114, 243, 0.34)',
  },
  'silver-single-beam-chase': {
    frame: '#edeef5',
    sweep: 'linear-gradient(120deg, #edeef5 0%, #edeef5 36%, #ffffff 47%, #edeef5 57%, #edeef5 100%)',
    bloom: 'rgba(237, 238, 245, 0.24)',
  },
  'gold-gradient-counter-sweep': {
    frame: '#f8ce73',
    sweep:
      'linear-gradient(120deg, #f8ce73 0%, #e6b34a 28%, #fff4dc 42%, #e6b34a 56%, #f8ce73 83%, #f8ce73 100%)',
    bloom: 'rgba(248, 206, 115, 0.30)',
  },
  'rainbow-gradient-drift': {
    frame: '#a9a6f7',
    sweep:
      'linear-gradient(120deg, #ff6487 0%, #ffb86b 15%, #f6ef78 29%, #69f0b2 44%, #62dcff 59%, #8d78ff 75%, #ff72e1 89%, #ff6487 100%)',
    bloom: 'rgba(169, 166, 247, 0.42)',
  },
  'mint-gold-highlight-orbit': {
    frame: '#74c9f9',
    sweep:
      'linear-gradient(120deg, #74c9f9 0%, #9fffe0 22%, #74c9f9 39%, #fff8d6 53%, #74c9f9 69%, #42e1c2 86%, #74c9f9 100%)',
    bloom: 'rgba(116, 201, 249, 0.46)',
  },
}

export const foilFor = (tier: Tier): Foil => FOIL[tier.glowStyle]

/** Radius ladder — `--radius-*` in `web/src/index.css`, doubled for the 1200×630 canvas. */
export const RADIUS = { sm: 24, md: 32, lg: 48, xl: 64, full: 9999 } as const
