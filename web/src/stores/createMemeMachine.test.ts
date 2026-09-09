import { createActor } from 'xstate'
import { describe, expect, it } from 'vitest'
import type { GiphyResult } from '../lib/types'
import { createMemeMachine } from './createMemeMachine'

function startedMachine(remixId: string | null = null) {
  return createActor(createMemeMachine, { input: { remixId } }).start()
}

const giphyResult: GiphyResult = {
  id: 'cat-1',
  title: 'Keyboard cat',
  stillUrl: '/cat-still.png',
  gifUrl: '/cat.gif',
  mp4Url: null,
  author: 'catlord',
  url: 'https://giphy.com/gifs/cat-1',
}

describe('createMemeMachine submitting mode changes', () => {
  it('ignores a mode tap while a job is running and returns to the mode it left', () => {
    const actor = startedMachine()
    actor.send({ type: 'SELECT_MODE', mode: 'upload' })
    actor.send({ type: 'SUBMIT', busy: 'Rendering…' })
    actor.send({ type: 'SELECT_MODE', mode: 'giphy' })

    expect(actor.getSnapshot().value).toBe('submitting')
    expect(actor.getSnapshot().context).toMatchObject({ mode: 'upload', busy: 'Rendering…' })

    actor.send({ type: 'DONE' })
    expect(actor.getSnapshot().value).toBe('upload')
    expect(actor.getSnapshot().context.busy).toBeNull()
  })

  it('clears busy and exposes failure so the user can retry from the same mode', () => {
    const actor = startedMachine()
    actor.send({ type: 'SELECT_MODE', mode: 'upload' })
    actor.send({ type: 'SUBMIT', busy: 'Rendering…' })
    actor.send({ type: 'TICK', elapsed: '4s' })
    actor.send({ type: 'FAIL', err: 'credits exhausted' })

    expect(actor.getSnapshot().value).toBe('error')
    expect(actor.getSnapshot().context).toMatchObject({
      mode: 'upload',
      busy: null,
      busyElapsed: null,
      err: 'credits exhausted',
    })

    actor.send({ type: 'SELECT_MODE', mode: 'generate' })
    expect(actor.getSnapshot().value).toBe('generate')
  })

  it('reports a pre-flight rejection in place, without a busy flash', () => {
    const actor = startedMachine()
    actor.send({ type: 'SELECT_MODE', mode: 'upload' })
    actor.send({ type: 'FAIL', err: 'that video is 143MB — the cap is 50MB, try a shorter clip' })

    expect(actor.getSnapshot().value).toBe('upload')
    expect(actor.getSnapshot().context).toMatchObject({ busy: null, err: expect.stringContaining('143MB') })
  })

  it('holds the minted card with its share link instead of ending on an empty state', () => {
    const actor = startedMachine('source-1')
    actor.send({ type: 'SUBMIT', busy: 'Minting…' })
    actor.send({ type: 'MINTED', id: 'meme-1', shareUrl: 'https://memeon.ai/m/meme-1' })

    expect(actor.getSnapshot().value).toBe('success')
    expect(actor.getSnapshot().context).toMatchObject({
      busy: null,
      mintedId: 'meme-1',
      shareUrl: 'https://memeon.ai/m/meme-1',
      shareCopied: false,
    })

    actor.send({ type: 'SHARE_COPIED' })
    expect(actor.getSnapshot().context.shareCopied).toBe(true)
  })
})

describe('createMemeMachine artwork provenance', () => {
  it('stamps the pick and drops it the moment the artwork is replaced', () => {
    const actor = startedMachine()
    actor.send({ type: 'PICK_GIPHY', pick: giphyResult })
    expect(actor.getSnapshot().context).toMatchObject({
      imageUrl: '/cat.gif',
      title: 'Keyboard cat',
      artworkSource: { provider: 'giphy', id: 'cat-1', author: 'catlord' },
    })

    /* switching modes keeps both the artwork and its credit */
    actor.send({ type: 'SELECT_MODE', mode: 'upload' })
    expect(actor.getSnapshot().context.artworkSource).toMatchObject({ provider: 'giphy' })

    /* replacing the artwork retires the credit with it */
    actor.send({ type: 'SET_IMAGE_URL', imageUrl: '/uploaded.png' })
    expect(actor.getSnapshot().context.artworkSource).toBeNull()
  })

  it('restores a draft alongside a resumed render', () => {
    const actor = startedMachine()
    actor.send({
      type: 'RESTORE_DRAFT',
      draft: { mode: 'video', title: 'burning office', tags: 'chaos', prompt: 'a capybara' },
    })
    actor.send({ type: 'SUBMIT', busy: 'Resuming a video render already in progress…' })
    actor.send({ type: 'DONE' })

    expect(actor.getSnapshot().value).toBe('video')
    expect(actor.getSnapshot().context).toMatchObject({
      title: 'burning office',
      tags: 'chaos',
      prompt: 'a capybara',
    })
  })
})
