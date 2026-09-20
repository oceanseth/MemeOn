import { afterEach, describe, expect, it } from 'vitest'
import { getPlayVideosSnapshot, setPlayVideos, subscribePlayVideos } from './playbackPreference'

afterEach(() => {
  setPlayVideos(true)
})

describe('playbackPreference', () => {
  it('defaults to playing videos and can be turned off', () => {
    expect(getPlayVideosSnapshot().playVideos).toBe(true)
    setPlayVideos(false)
    expect(getPlayVideosSnapshot().playVideos).toBe(false)
  })

  it('notifies subscribers when the preference flips', () => {
    const seen: boolean[] = []
    const stop = subscribePlayVideos(() => seen.push(getPlayVideosSnapshot().playVideos))
    setPlayVideos(false)
    setPlayVideos(false)
    setPlayVideos(true)
    stop()
    expect(seen).toEqual([false, true])
  })
})
