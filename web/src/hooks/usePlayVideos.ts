import { useSyncExternalStore } from 'react'
import {
  getPlayVideosSnapshot,
  setPlayVideos,
  subscribePlayVideos,
} from '../lib/playbackPreference'

export function usePlayVideos() {
  const { playVideos } = useSyncExternalStore(
    subscribePlayVideos,
    getPlayVideosSnapshot,
    getPlayVideosSnapshot,
  )
  return { playVideos, setPlayVideos }
}
