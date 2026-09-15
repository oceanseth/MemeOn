import { cn } from '../lib/cn'
import { FOCUS_RING } from '../lib/focus'
import type { HeroVideoModel } from '../lib/heroVideoModel'

/* Soft Press materials: the relief is the edge, so the frame is a raised surface rather than a
   hairline box. On phones it bleeds to the container's own gutter and drops its radius. */
const FRAME = cn(
  'relative aspect-video overflow-hidden rounded-card border-0 bg-surface shadow-raised',
  'max-md:-mx-5 max-md:rounded-none',
)

/* the shared pill chrome: font/line-height are reset so each pill can size its own text */
const PILL = cn(
  'absolute cursor-pointer rounded-pill border-0 font-[inherit] leading-none text-ink shadow-raised',
  'bg-[color-mix(in_oklab,var(--color-surface-raised)_82%,transparent)] backdrop-blur-[6px]',
  '[transition:background_var(--dur-base)_ease,box-shadow_var(--dur-base)_ease]',
  'motion-reduce:transition-none',
  'hover:bg-surface-raised',
  FOCUS_RING,
)

/**
 * The promo film in a raised frame, with the two pills as its only controls — never the UA's grey
 * bar. Pure: which pill shows, and what it says, comes from the model (`hooks/useHeroVideo`).
 */
export function HeroVideo({ model, className }: { model: HeroVideoModel; className?: string }) {
  return (
    <div data-slot="hero-video" className={cn(FRAME, className)}>
      <video
        className="block h-full w-full object-cover"
        controls={false}
        muted
        loop
        playsInline
        {...model.videoProps}
      />
      {model.showPlayPill && (
        <button
          type="button"
          data-slot="hero-video-play"
          className={cn(
            PILL,
            'top-1/2 left-1/2 min-h-11 -translate-x-1/2 -translate-y-1/2 px-5 py-3 text-label font-semibold',
          )}
          {...model.playButtonProps}
        >
          <span aria-hidden="true">▶</span> {model.playLabel}
        </button>
      )}
      {model.showSoundPill && (
        <button
          type="button"
          data-slot="hero-video-sound"
          className={cn(
            PILL,
            'right-3 bottom-3 px-3.5 py-2 text-caption',
            'max-md:top-2 max-md:right-2 max-md:bottom-auto max-md:px-2.75 max-md:py-1.75 max-md:text-micro',
          )}
          {...model.soundButtonProps}
        >
          {model.soundLabel}
        </button>
      )}
    </div>
  )
}
