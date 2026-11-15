import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateMemeContext, CreateMemeEvent } from '../../stores/createMemeMachine'
import { paperMeme } from '../../test/fixtures'
import type { CreationLifetime } from '../createMemeVideoPoll'
import type { Meme } from '../types'
import type { CreateMemeActionHost } from './actionHost'
import { prefillMotion, resetMotionPrefill } from './motionActions'
import { baseCreateMemeContext } from './testContext'

const { suggestMotion } = vi.hoisted(() => ({ suggestMotion: vi.fn() }))
vi.mock('../motionSuggest', () => ({ suggestMotion }))

const VIDEO = 'https://files/clip.mp4'
const videoMeme: Meme = { ...paperMeme, mediaType: 'video', videoUrl: VIDEO }

function motionHost(over: Partial<CreateMemeContext> = {}) {
  const events: CreateMemeEvent[] = []
  const owner: CreationLifetime = { active: true }
  const state = {
    ctx: {
      ...baseCreateMemeContext,
      mode: 'remix',
      remixOutput: 'video',
      remixSource: videoMeme,
      ...over,
    } as CreateMemeContext,
  }
  const host: CreateMemeActionHost = {
    getCtx: () => state.ctx,
    send: (event) => {
      events.push(event)
    },
    beginBusy: () => {
      throw new Error('a motion prefill never makes the desk busy')
    },
    settleBusy: () => {
      throw new Error('a motion prefill never makes the desk busy')
    },
    pollVideo: () => {
      throw new Error('a motion prefill never polls')
    },
    getOwner: () => owner,
  }
  return { host, events, owner, state }
}

const settled = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('prefillMotion', () => {
  beforeEach(() => {
    resetMotionPrefill()
    suggestMotion.mockReset()
    suggestMotion.mockResolvedValue('a man turns and laughs')
  })

  it('offers the on-device description of the source clip', async () => {
    const { host, events } = motionHost()
    prefillMotion(host)
    await settled()
    expect(suggestMotion).toHaveBeenCalledWith(`${VIDEO}?frame=1`, videoMeme.title)
    expect(events).toEqual([{ type: 'SET_MOTION_SUGGESTION', motion: 'a man turns and laughs' }])
  })

  it('asks about a clip once, however often the output is switched', async () => {
    const { host } = motionHost()
    prefillMotion(host)
    prefillMotion(host)
    await settled()
    expect(suggestMotion).toHaveBeenCalledOnce()
  })

  it('stays out of an image remix', () => {
    prefillMotion(motionHost({ remixOutput: 'image' }).host)
    expect(suggestMotion).not.toHaveBeenCalled()
  })

  it('has nothing to describe for an image meme', () => {
    prefillMotion(motionHost({ remixSource: paperMeme }).host)
    expect(suggestMotion).not.toHaveBeenCalled()
  })

  it('leaves the field alone where the browser has no model', async () => {
    suggestMotion.mockResolvedValue(null)
    const { host, events } = motionHost()
    prefillMotion(host)
    await settled()
    expect(events).toEqual([])
  })

  it('drops an answer that lands after the desk is gone', async () => {
    const { host, events, owner } = motionHost()
    prefillMotion(host)
    owner.active = false
    await settled()
    expect(events).toEqual([])
  })
})
