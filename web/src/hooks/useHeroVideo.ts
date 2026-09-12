import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import {
  buildHeroVideoModel,
  readAutoplayEnvironment,
  subscribeToAutoplayEnvironment,
  type HeroVideoModel,
} from '../lib/heroVideoModel'

export interface UseHeroVideoOptions {
  /** Overrides the environment probe. Tests drive both branches with it. */
  autoplay?: boolean
}

/**
 * The promo film's engine: whether autoplay is spent, whether the visitor started it, and the
 * sound toggle. The media element stays the source of truth for playback; this hook only nudges
 * it, because unmuting a muted autoplaying element pauses it on some mobile browsers.
 */
export function useHeroVideo({ autoplay }: UseHeroVideoOptions = {}): HeroVideoModel {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  /* stable, so React attaches the element once rather than on every render */
  const attachVideo = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element
  }, [])
  const [muted, setMuted] = useState(true)
  const [started, setStarted] = useState(false)
  const environmentAutoplay = useSyncExternalStore(
    subscribeToAutoplayEnvironment,
    readAutoplayEnvironment,
    () => true,
  )

  const onStart = () => {
    const v = videoRef.current
    setStarted(true)
    if (v?.paused) void v.play().catch(() => {})
  }

  const onToggleSound = () => {
    const v = videoRef.current
    if (!v) return
    const next = !muted
    v.muted = next
    setMuted(next)
    if (!next && v.paused) void v.play().catch(() => {})
  }

  return buildHeroVideoModel({
    autoplay: autoplay ?? environmentAutoplay,
    muted,
    started,
    attachVideo,
    onStart,
    onToggleSound,
  })
}
