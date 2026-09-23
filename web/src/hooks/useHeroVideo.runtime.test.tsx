import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHeroVideo } from './useHeroVideo'

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function Harness({ mountVideo = true }: { mountVideo?: boolean }) {
  const model = useHeroVideo({ autoplay: false })
  return (
    <>
      {mountVideo ? <video {...model.videoProps} /> : null}
      <button type="button" {...model.playButtonProps} />
      <output
        data-play={model.showPlayPill ? 'true' : 'false'}
        data-sound={model.showSoundPill ? 'true' : 'false'}
      />
    </>
  )
}

const PLAY_ONLY = { play: 'true', sound: 'false' }
const STARTED = { play: 'false', sound: 'true' }

async function render(node: ReactNode) {
  await act(() => {
    root.render(node)
  })
}

function pills() {
  const output = host.querySelector('output')
  return {
    play: output?.getAttribute('data-play'),
    sound: output?.getAttribute('data-sound'),
  }
}

function shadowPaused(video: HTMLVideoElement, paused: boolean) {
  Object.defineProperty(video, 'paused', { value: paused, configurable: true })
}

describe('useHeroVideo', () => {
  it('stays on the play pill when no element is attached', async () => {
    const play = vi.spyOn(HTMLVideoElement.prototype, 'play')
    await render(<Harness mountVideo={false} />)

    await act(() => {
      host.querySelector('button')!.click()
    })

    expect(host.querySelector('video')).toBeNull()
    expect(play).not.toHaveBeenCalled()
    expect(pills()).toEqual(PLAY_ONLY)
    play.mockRestore()
  })

  it('keeps the play pill when play() rejects and calls play again on the next click', async () => {
    await render(<Harness />)
    const video = host.querySelector('video')!
    const play = vi.fn(() => Promise.reject(new Error('blocked')))
    video.play = play as unknown as HTMLVideoElement['play']
    shadowPaused(video, true)

    await act(async () => {
      host.querySelector('button')!.click()
    })
    expect(play).toHaveBeenCalledOnce()
    expect(pills()).toEqual(PLAY_ONLY)

    await act(async () => {
      host.querySelector('button')!.click()
    })
    expect(play).toHaveBeenCalledTimes(2)
    expect(pills()).toEqual(PLAY_ONLY)
  })

  it('flips the pills from a play event once the element is already playing', async () => {
    await render(<Harness />)
    const video = host.querySelector('video')!
    const play = vi.fn(() => Promise.resolve())
    video.play = play as unknown as HTMLVideoElement['play']
    shadowPaused(video, false)

    await act(() => {
      video.dispatchEvent(new Event('play'))
    })

    expect(play).not.toHaveBeenCalled()
    expect(pills()).toEqual(STARTED)
  })

  it('flips the pills from one play() that starts the element and fires play', async () => {
    await render(<Harness />)
    const video = host.querySelector('video')!
    const play = vi.fn(() => {
      shadowPaused(video, false)
      video.dispatchEvent(new Event('play'))
      return Promise.resolve()
    })
    video.play = play as unknown as HTMLVideoElement['play']
    shadowPaused(video, true)

    await act(async () => {
      host.querySelector('button')!.click()
    })

    expect(play).toHaveBeenCalledOnce()
    expect(pills()).toEqual(STARTED)
  })
})
