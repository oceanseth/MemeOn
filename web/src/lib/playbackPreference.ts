/** Device-level “play video memes” preference. Default on; reduced-motion still wins per card. */
export const PLAY_VIDEOS_STORAGE_KEY = 'memeon_play_videos'

export type PlaybackSnapshot = { readonly playVideos: boolean }

const listeners = new Set<() => void>()
let snapshot: PlaybackSnapshot = { playVideos: true }
let hydrated = false

const storage = (): Pick<Storage, 'getItem' | 'setItem'> | undefined =>
  typeof localStorage === 'undefined' ? undefined : localStorage

const readStored = (): boolean => {
  const raw = storage()?.getItem(PLAY_VIDEOS_STORAGE_KEY)
  if (raw === '0' || raw === 'false') return false
  if (raw === '1' || raw === 'true') return true
  return true
}

const notify = (): void => {
  for (const listener of listeners) listener()
}

const hydrate = (): void => {
  if (hydrated) return
  hydrated = true
  const playVideos = readStored()
  if (playVideos !== snapshot.playVideos) snapshot = { playVideos }
}

export function subscribePlayVideos(onStoreChange: () => void): () => void {
  hydrate()
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function getPlayVideosSnapshot(): PlaybackSnapshot {
  hydrate()
  return snapshot
}

export function setPlayVideos(playVideos: boolean): void {
  hydrate()
  storage()?.setItem(PLAY_VIDEOS_STORAGE_KEY, playVideos ? '1' : '0')
  if (playVideos === snapshot.playVideos) return
  snapshot = { playVideos }
  notify()
}
