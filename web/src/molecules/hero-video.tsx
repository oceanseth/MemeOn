import { Button } from '@/atoms/button'
import { cn } from '../lib/cn'
import type { HeroVideoModel } from '../lib/heroVideoModel'

/* Soft Press materials: the relief is the edge, so the frame is a raised surface rather than a
   hairline box. On phones it bleeds to the container's own gutter and drops its radius. */
const FRAME = cn(
  'relative aspect-video overflow-hidden rounded-lg material-card',
  'max-md:-mx-5 max-md:rounded-none',
)

/** Where each control sits on the frame; the pill itself is `Button variant="glass"`. */
const PLAY_PLACEMENT = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
const SOUND_PLACEMENT = 'absolute right-3 bottom-3 max-md:top-2 max-md:right-2 max-md:bottom-auto'

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
        <Button
          variant="glass"
          size="pill"
          data-slot="hero-video-play"
          className={PLAY_PLACEMENT}
          {...model.playButtonProps}
        >
          <span aria-hidden="true">▶</span> {model.playLabel}
        </Button>
      )}
      {model.showSoundPill && (
        <Button
          variant="glass"
          size="pill-sm"
          data-slot="hero-video-sound"
          className={SOUND_PLACEMENT}
          {...model.soundButtonProps}
        >
          {model.soundLabel}
        </Button>
      )}
    </div>
  )
}
