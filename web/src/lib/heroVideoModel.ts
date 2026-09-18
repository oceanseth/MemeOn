import type { ButtonHTMLAttributes, RefCallback, VideoHTMLAttributes } from 'react'
import { heroVideoCopy as copy } from '../copy/heroVideo'

/**
 * The landing-page promo film, as props.
 *
 * Autoplays muted and looping, which is the only way browsers allow autoplay — so the film is
 * authored to carry itself silently (burned-in captions, and the tier ladder reads without
 * narration). The sound toggle is opt-in.
 *
 * `poster` paints a real frame while the mp4 streams, so the frame never flashes an empty box on a
 * cold load.
 *
 * Autoplay is spent only where it is welcome: not when the visitor asked their OS for reduced
 * motion, and not on a metered or slow connection, where 1.5 MB of film is the whole page. Both
 * fall back to the same path — the branded poster and a play pill, nothing preloaded — so the
 * visitor starts it deliberately, and the frame is never handed over to the browser's own grey
 * control bar.
 *
 * The environment probe and the builder live here; `hooks/useHeroVideo` owns the state and the
 * element, `molecules/HeroVideo` only renders.
 */

export const HERO_VIDEO_SRC = '/promo/memeon-promo.mp4'
export const HERO_VIDEO_POSTER = '/promo/memeon-promo-poster.jpg'
const HERO_VIDEO_LABEL = copy.ariaLabel

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

/** Whether this visit should spend autoplay: no reduced-motion ask, no Data Saver, no 2g/3g. */
export function readAutoplayEnvironment(): boolean {
  if (motionQuery()?.matches) return false
  const link = networkInformation()
  if (!link) return true
  return link.saveData !== true && !FRUGAL_CONNECTIONS.has(link.effectiveType ?? '')
}

/** Live subscription: a preference toggled after load still lands. */
export function subscribeToAutoplayEnvironment(onChange: () => void): () => void {
  const query = motionQuery()
  const link = networkInformation()
  query?.addEventListener('change', onChange)
  link?.addEventListener?.('change', onChange)
  return () => {
    query?.removeEventListener('change', onChange)
    link?.removeEventListener?.('change', onChange)
  }
}

export type HeroVideoElementProps = Pick<
  VideoHTMLAttributes<HTMLVideoElement>,
  'src' | 'poster' | 'autoPlay' | 'preload' | 'aria-label' | 'onPlay'
> & {
  /* a callback, not a ref object: the model must stay a plain props bag (stories put it in args,
     and a ref object would carry the mounted element back out with it) */
  ref: RefCallback<HTMLVideoElement>
}

export type HeroVideoButtonProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'aria-pressed' | 'aria-label'
>

export interface HeroVideoModel {
  /** the play pill over the poster: only in the withheld-autoplay branch, until the visitor starts it */
  showPlayPill: boolean
  /** the sound toggle: once the film is running, by autoplay or by hand */
  showSoundPill: boolean
  playLabel: string
  soundLabel: string
  videoProps: HeroVideoElementProps
  playButtonProps: HeroVideoButtonProps
  soundButtonProps: HeroVideoButtonProps
}

export interface HeroVideoState {
  /** whether autoplay is spent on this visit (the environment probe, or a story's override) */
  autoplay: boolean
  muted: boolean
  /**
   * The film is running: the visitor pressed play, or autoplay took. Set from the element's own
   * `play` event too, so a probe that flips mid-visit (Data Saver switched on) never draws a play
   * pill over a film that is already going.
   */
  started: boolean
  /** receives the mounted element (and `null` on unmount); the hook keeps it for `play()` */
  attachVideo: RefCallback<HTMLVideoElement>
  onStart: () => void
  onToggleSound: () => void
}

export function buildHeroVideoModel({
  autoplay,
  muted,
  started,
  attachVideo,
  onStart,
  onToggleSound,
}: HeroVideoState): HeroVideoModel {
  const running = autoplay || started
  return {
    showPlayPill: !autoplay && !started,
    showSoundPill: running,
    playLabel: copy.play,
    soundLabel: muted ? copy.soundOn : copy.soundOff,
    videoProps: {
      ref: attachVideo,
      src: HERO_VIDEO_SRC,
      poster: HERO_VIDEO_POSTER,
      autoPlay: autoplay,
      // nothing downloads until the visitor asks, where autoplay is withheld
      preload: autoplay ? 'metadata' : 'none',
      'aria-label': HERO_VIDEO_LABEL,
      onPlay: onStart,
    },
    playButtonProps: { onClick: onStart },
    soundButtonProps: {
      onClick: onToggleSound,
      'aria-pressed': !muted,
      'aria-label': muted ? copy.unmute : copy.mute,
    },
  }
}
