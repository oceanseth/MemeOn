import { useRef, useState } from 'react'
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
 * If the visitor asked their OS for reduced motion we don't autoplay a 50s film
 * at them: the poster shows and native controls let them start it deliberately.
 */
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

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
          autoPlay={!prefersReducedMotion}
          controls={prefersReducedMotion}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="MemeOn in 50 seconds: mint a meme, watch it climb the virality tiers, trade it."
        />
        {!prefersReducedMotion && (
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
