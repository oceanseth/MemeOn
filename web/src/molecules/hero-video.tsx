import { cva } from 'class-variance-authority'
import { cn } from '../lib/cn'
import type { HeroVideoModel } from '../lib/heroVideoModel'

/* Soft Press materials: the relief is the edge, so the frame is a raised surface rather than a
   hairline box. On phones it bleeds to the container's own gutter and drops its radius. */
const FRAME = cn(
  'relative aspect-video overflow-hidden rounded-lg material-card',
  'max-md:-mx-page-x max-md:rounded-none',
)

/**
 * The film's own controls. A glass plate over moving pictures is the one place a button pill is
 * translucent, and the `Button` atom has no `glass` variant (`MO2/requests.md` asks for one), so
 * the pair is a local cva over the two buttons: one recipe, two placements. Each placement names
 * its type step and nothing else — the step carries its own line-height.
 */
const pillVariants = cva(
  cn(
    'absolute cursor-pointer rounded-full text-foreground',
    /* glass sorts after the material, so the plate is glass and the relief is raised */
    'material-raised glass',
    'transition-press',
    'hover:bg-accent',
    'focus-ring',
  ),
  {
    variants: {
      placement: {
        /** the poster's one call to action, centred on the frame */
        play: 'top-1/2 left-1/2 min-h-hit -translate-x-1/2 -translate-y-1/2 px-5 py-3 text-base font-semibold',
        /** the sound toggle rides the corner; the phone moves it clear of the caption */
        sound: cn(
          'right-3 bottom-3 px-3.5 py-2 text-sm',
          'max-md:top-2 max-md:right-2 max-md:bottom-auto max-md:px-3 max-md:py-2 max-md:text-xs',
        ),
      },
    },
    defaultVariants: { placement: 'sound' },
  },
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
          className={pillVariants({ placement: 'play' })}
          {...model.playButtonProps}
        >
          <span aria-hidden="true">▶</span> {model.playLabel}
        </button>
      )}
      {model.showSoundPill && (
        <button
          type="button"
          data-slot="hero-video-sound"
          className={pillVariants({ placement: 'sound' })}
          {...model.soundButtonProps}
        >
          {model.soundLabel}
        </button>
      )}
    </div>
  )
}
