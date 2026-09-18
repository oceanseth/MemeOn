import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MouseEvent } from 'react'
import { applyCardVisibility, cardMediaRef, toggleCardMedia } from './cardMedia'

/**
 * The viewport observer replaced `autoPlay` on the card, so on-screen playback is behaviour no
 * story can assert: whether a card has scrolled into view, and whether `play()` resolved, are both
 * decided after the story's play function has run. These drive it directly instead.
 */
interface Card {
  card: HTMLElement
  video: HTMLVideoElement
  toggle: HTMLButtonElement
  play: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
}

function mountCard({ autoplay = 'on' }: { autoplay?: 'on' | 'off' } = {}): Card {
  const card = document.createElement('article')
  card.dataset.slot = 'meme-card'
  card.dataset.mediaAutoplay = autoplay
  card.innerHTML =
    '<video></video><button data-slot="media-toggle" aria-pressed="false"></button>'
  document.body.append(card)

  const video = card.querySelector('video')!
  const toggle = card.querySelector<HTMLButtonElement>('[data-slot="media-toggle"]')!
  const play = vi.fn(async () => {
    Object.defineProperty(video, 'paused', { value: false, configurable: true })
  })
  const pause = vi.fn(() => {
    Object.defineProperty(video, 'paused', { value: true, configurable: true })
  })
  video.play = play as unknown as HTMLVideoElement['play']
  video.pause = pause
  Object.defineProperty(video, 'paused', { value: true, configurable: true })

  return { card, video, toggle, play, pause }
}

const clickOn = (toggle: HTMLButtonElement) =>
  toggleCardMedia({ currentTarget: toggle } as unknown as MouseEvent<HTMLButtonElement>)

afterEach(() => {
  document.body.replaceChildren()
})

describe('card media', () => {
  it('pauses the foil ring and the video off screen and restores both on screen', async () => {
    const { card, toggle, play, pause } = mountCard()

    applyCardVisibility(card, false)
    expect(card.style.getPropertyValue('--glow-play-state')).toBe('paused')
    expect(pause).toHaveBeenCalledOnce()
    expect(toggle.getAttribute('aria-pressed')).toBe('false')

    applyCardVisibility(card, true)
    // removed, not set to `running`: Paper and Silver keep the paused ring their tier rule asks for
    expect(card.style.getPropertyValue('--glow-play-state')).toBe('')
    expect(play).toHaveBeenCalledOnce()
    await vi.waitFor(() => expect(toggle.getAttribute('aria-pressed')).toBe('true'))
  })

  it('never starts a card whose media is not allowed to autoplay', () => {
    const { card, play } = mountCard({ autoplay: 'off' })

    applyCardVisibility(card, true)

    expect(card.style.getPropertyValue('--glow-play-state')).toBe('')
    expect(play).not.toHaveBeenCalled()
  })

  it('lets a manual pause outlive scrolling past the card', async () => {
    const { card, toggle, play, pause } = mountCard()

    applyCardVisibility(card, true)
    await vi.waitFor(() => expect(toggle.getAttribute('aria-pressed')).toBe('true'))

    clickOn(toggle)
    expect(pause).toHaveBeenCalledOnce()
    expect(toggle.getAttribute('aria-pressed')).toBe('false')

    applyCardVisibility(card, false)
    applyCardVisibility(card, true)
    expect(play).toHaveBeenCalledOnce()
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('lets a manual play outlive scrolling past a card that may not autoplay', async () => {
    const { card, toggle, play } = mountCard({ autoplay: 'off' })

    clickOn(toggle)
    await vi.waitFor(() => expect(toggle.getAttribute('aria-pressed')).toBe('true'))

    applyCardVisibility(card, false)
    applyCardVisibility(card, true)
    expect(play).toHaveBeenCalledTimes(2)
  })

  it('hands every card the same ref and releases the ones React has unmounted', () => {
    const observed: Element[] = []
    const released: Element[] = []
    const observe = vi
      .spyOn(IntersectionObserver.prototype, 'observe')
      .mockImplementation((target: Element) => void observed.push(target))
    const unobserve = vi
      .spyOn(IntersectionObserver.prototype, 'unobserve')
      .mockImplementation((target: Element) => void released.push(target))

    const first = mountCard()
    cardMediaRef(first.card)
    // React 18 hands the ref `null` on detach, so the element is released by the next sweep
    first.card.remove()
    cardMediaRef(null)

    const second = mountCard()
    cardMediaRef(second.card)

    expect(observed).toEqual([first.card, second.card])
    expect(released).toEqual([first.card])

    observe.mockRestore()
    unobserve.mockRestore()
  })
})
