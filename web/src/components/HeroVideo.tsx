import { useRef, useState, useSyncExternalStore } from 'react'
import { cn } from '../lib/cn'
import { FOCUS_RING } from '../lib/focus'

/**
 * Landing-page hero video.
 *
 * Autoplays muted and looping, which is the only way browsers allow autoplay —
 * so the film is authored to carry itself silently (burned-in captions, and the
 * tier ladder reads without narration). The sound toggle is opt-in.
 *
 * `poster` paints a real frame while the mp4 streams, so the hero never flashes
 * an empty box on a cold load.
 *
 * Autoplay is spent only where it is welcome: not when the visitor asked their OS
 * for reduced motion, and not on a metered or slow connection, where 1.5 MB of
 * film is the whole page. Both fall back to the same path — the branded poster and
 * a play pill, nothing preloaded — so the visitor starts it deliberately, and the
 * hero is never handed over to the browser's own grey control bar.
 */

interface NetworkInformation {
  saveData?: boolean
  effectiveType?: string
  addEventListener?: (type: 'change', listener: () => void) => void
  removeEventListener?: (type: 'change', listener: () => void) => void
}

const FRUGAL_CONNECTIONS = new Set(['slow-2g', '2g', '3g'])

const motionQuery = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

const networkInformation = (): NetworkInformation | undefined =>
  typeof navigator === 'undefined'
    ? undefined
    : (navigator as Navigator & { connection?: NetworkInformation }).connection

function readAutoplayEnvironment(): boolean {
  if (motionQuery()?.matches) return false
  const link = networkInformation()
  if (!link) return true
  return link.saveData !== true && !FRUGAL_CONNECTIONS.has(link.effectiveType ?? '')
}

/** Live subscription: a preference toggled after load still lands. */
function subscribeToAutoplayEnvironment(onChange: () => void): () => void {
  const query = motionQuery()
  const link = networkInformation()
  query?.addEventListener('change', onChange)
  link?.addEventListener?.('change', onChange)
  return () => {
    query?.removeEventListener('change', onChange)
    link?.removeEventListener?.('change', onChange)
  }
}

export interface HeroVideoProps {
  /** Overrides the environment probe. Stories and tests drive both branches with it. */
  autoplay?: boolean
}

/* Soft Press materials: the relief is the edge, so the frame is a raised surface rather than a
   hairline box, and the tint comes from the semantic tokens (no legacy `--color-accent` alias). */
const FRAME = cn(
  'relative aspect-video overflow-hidden rounded-card border-0 bg-surface shadow-raised',
  'max-md:rounded-none',
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

export default function HeroVideo({ autoplay }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  /** Only meaningful in the withheld-autoplay branch: the visitor started the film themselves. */
  const [started, setStarted] = useState(false)
  const environmentAutoplay = useSyncExternalStore(
    subscribeToAutoplayEnvironment,
    readAutoplayEnvironment,
    () => true,
  )
  const shouldAutoplay = autoplay ?? environmentAutoplay

  const start = () => {
    const v = videoRef.current
    setStarted(true)
    if (v?.paused) void v.play().catch(() => {})
  }

  const toggleSound = () => {
    const v = videoRef.current
    if (!v) return
    const next = !muted
    v.muted = next
    setMuted(next)
    // some mobile browsers pause a muted autoplaying element when it is
    // unmuted — nudge it back if that happens
    if (!next && v.paused) void v.play().catch(() => {})
  }

  return (
    <div
      data-slot="hero-video"
      className="mx-auto mt-1 mb-[30px] max-w-[1080px] px-4 max-md:mx-[calc(50%-50vw)] max-md:max-w-none max-md:px-0"
    >
      <div className={FRAME} data-slot="hero-video-frame">
        <video
          ref={videoRef}
          className="block h-full w-full object-cover"
          src="/promo/memeon-promo.mp4"
          poster="/promo/memeon-promo-poster.jpg"
          autoPlay={shouldAutoplay}
          // never the UA's grey bar: the pills below are the only controls this hero shows
          controls={false}
          muted
          loop
          playsInline
          preload={shouldAutoplay ? 'metadata' : 'none'}
          aria-label="MemeOn in 50 seconds: mint a meme, watch it climb the virality tiers, trade it."
        />
        {!shouldAutoplay && !started && (
          <button
            type="button"
            onClick={start}
            className={cn(
              PILL,
              'top-1/2 left-1/2 min-h-11 -translate-x-1/2 -translate-y-1/2 px-5 py-3 text-label font-semibold',
            )}
          >
            <span aria-hidden="true">▶</span> Play the 50-second tour
          </button>
        )}
        {(shouldAutoplay || started) && (
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={!muted}
            aria-label={muted ? 'Unmute the video' : 'Mute the video'}
            className={cn(
              PILL,
              'right-3 bottom-3 px-3.5 py-2 text-caption',
              'max-md:top-2 max-md:right-2 max-md:bottom-auto max-md:px-[11px] max-md:py-[7px] max-md:text-micro',
            )}
          >
            {muted ? '🔇 Sound on' : '🔊 Sound off'}
          </button>
        )}
      </div>
    </div>
  )
}
