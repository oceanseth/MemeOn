import { expect } from 'vitest'

type ShareCopyActor = {
  send: (event: { type: 'SET_COPIED'; copied: boolean; failed?: boolean }) => void
  getSnapshot: () => { context: { copied: boolean; copyFailed: boolean } }
}

export function expectShareCopySequence(actor: ShareCopyActor): void {
  actor.send({ type: 'SET_COPIED', copied: false, failed: true })
  expect(actor.getSnapshot().context).toMatchObject({
    copied: false,
    copyFailed: true,
  })

  actor.send({ type: 'SET_COPIED', copied: false })
  expect(actor.getSnapshot().context.copyFailed).toBe(true)

  actor.send({ type: 'SET_COPIED', copied: true })
  expect(actor.getSnapshot().context).toMatchObject({
    copied: true,
    copyFailed: false,
  })

  actor.send({ type: 'SET_COPIED', copied: false })
  expect(actor.getSnapshot().context).toMatchObject({
    copied: false,
    copyFailed: false,
  })
}
