import { describe, expect, it, vi } from 'vitest'
import { buildHeroVideoModel, type HeroVideoState } from './heroVideoModel'

const state = (overrides: Partial<HeroVideoState> = {}): HeroVideoState => ({
  autoplay: true,
  muted: true,
  started: false,
  attachVideo: vi.fn(),
  onStart: vi.fn(),
  onToggleSound: vi.fn(),
  ...overrides,
})

describe('buildHeroVideoModel', () => {
  it('spends autoplay where it is welcome: metadata preloads and the sound pill is the only control', () => {
    const model = buildHeroVideoModel(state())
    expect(model.videoProps.autoPlay).toBe(true)
    expect(model.videoProps.preload).toBe('metadata')
    expect(model.showPlayPill).toBe(false)
    expect(model.showSoundPill).toBe(true)
    expect(model.soundButtonProps['aria-label']).toBe('Unmute the video')
    expect(model.soundButtonProps['aria-pressed']).toBe(false)
    expect(model.soundLabel).toBe('🔇 Sound on')
  })

  it('withholds autoplay behind the poster and a play pill, downloading nothing', () => {
    const model = buildHeroVideoModel(state({ autoplay: false }))
    expect(model.videoProps.autoPlay).toBe(false)
    expect(model.videoProps.preload).toBe('none')
    expect(model.videoProps.poster).toBe('/promo/memeon-promo-poster.jpg')
    expect(model.showPlayPill).toBe(true)
    expect(model.showSoundPill).toBe(false)
  })

  it('swaps the play pill for the sound toggle once the visitor started it by hand', () => {
    const model = buildHeroVideoModel(state({ autoplay: false, started: true }))
    expect(model.showPlayPill).toBe(false)
    expect(model.showSoundPill).toBe(true)
  })

  it('names the way back once the sound is on', () => {
    const model = buildHeroVideoModel(state({ muted: false }))
    expect(model.soundButtonProps['aria-label']).toBe('Mute the video')
    expect(model.soundButtonProps['aria-pressed']).toBe(true)
    expect(model.soundLabel).toBe('🔊 Sound off')
  })

  it('hands the element and the handlers through untouched', () => {
    const s = state()
    const model = buildHeroVideoModel(s)
    expect(model.videoProps.ref).toBe(s.attachVideo)
    // the element's own play event counts as a start, so a mid-visit probe flip never hides a running film behind a play pill
    expect(model.videoProps.onPlay).toBe(s.onStart)
    expect(model.playButtonProps.onClick).toBe(s.onStart)
    expect(model.soundButtonProps.onClick).toBe(s.onToggleSound)
  })
})
