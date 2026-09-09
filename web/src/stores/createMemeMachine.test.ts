import { createActor } from 'xstate'
import { describe, expect, it } from 'vitest'
import { createMemeMachine } from './createMemeMachine'

function startedMachine(remixId: string | null = null) {
  return createActor(createMemeMachine, { input: { remixId } }).start()
}

describe('createMemeMachine submitting mode changes', () => {
  it('updates the visible mode without leaving submitting and returns to the latest mode on DONE', () => {
    const actor = startedMachine()
    actor.send({ type: 'SUBMIT', busy: 'Rendering…' })
    actor.send({ type: 'SELECT_MODE', mode: 'upload' })
    actor.send({ type: 'SELECT_MODE', mode: 'giphy' })

    expect(actor.getSnapshot().value).toBe('submitting')
    expect(actor.getSnapshot().context).toMatchObject({ mode: 'giphy', busy: 'Rendering…' })

    actor.send({ type: 'DONE' })
    expect(actor.getSnapshot().value).toBe('giphy')
    expect(actor.getSnapshot().context.busy).toBeNull()
  })

  it('clears busy and exposes failure after a mode change so the user can retry', () => {
    const actor = startedMachine()
    actor.send({ type: 'SUBMIT', busy: 'Rendering…' })
    actor.send({ type: 'SELECT_MODE', mode: 'upload' })
    actor.send({ type: 'FAIL', err: 'credits exhausted' })

    expect(actor.getSnapshot().value).toBe('error')
    expect(actor.getSnapshot().context).toMatchObject({ mode: 'upload', busy: null, err: 'credits exhausted' })

    actor.send({ type: 'SELECT_MODE', mode: 'generate' })
    expect(actor.getSnapshot().value).toBe('generate')
  })

  it('accepts terminal mint completion after any number of submitting mode changes', () => {
    const actor = startedMachine('source-1')
    actor.send({ type: 'SUBMIT', busy: 'Minting…' })
    actor.send({ type: 'SELECT_MODE', mode: 'upload' })
    actor.send({ type: 'SELECT_MODE', mode: 'video' })
    actor.send({ type: 'MINTED', id: 'meme-1' })

    expect(actor.getSnapshot().value).toBe('success')
    expect(actor.getSnapshot().context).toMatchObject({ mode: 'video', busy: null, mintedId: 'meme-1' })
  })
})
