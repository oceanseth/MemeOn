import { useRef, useState, useSyncExternalStore } from 'react'
import './HeroVideo.css'

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
    <div className="hero-video">
      <div className="hero-video-frame">
        <video
          ref={videoRef}
          className="hero-video-el"
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
          <button type="button" className="hero-video-play" onClick={start}>
            <span aria-hidden="true">▶</span> Play the 50-second tour
          </button>
        )}
        {(shouldAutoplay || started) && (
          <button
            type="button"
            className="hero-video-sound"
            onClick={toggleSound}
            aria-pressed={!muted}
            aria-label={muted ? 'Unmute the video' : 'Mute the video'}
          >
            {muted ? '🔇 Sound on' : '🔊 Sound off'}
          </button>
        )}
      </div>
    </div>
  )
}
