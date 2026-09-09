import { autorun, configure, isObservable } from 'mobx'
import { createActor, assign, setup } from 'xstate'
import { expect, it, vi } from 'vitest'
import { ActorSnapshotProjection } from './ActorSnapshotProjection'

it('observes exact immutable snapshots through an action without deep-proxying context', () => {
  const machine = setup({
    types: { context: {} as { count: number }, events: {} as { type: 'ADD' } },
  }).createMachine({
    context: { count: 0 },
    on: { ADD: { actions: assign({ count: ({ context }) => context.count + 1 }) } },
  })
  const actor = createActor(machine)
  const projection = new ActorSnapshotProjection(actor.getSnapshot())
  expect(projection.snapshot).toBe(actor.getSnapshot())
  expect(isObservable(projection.snapshot.context)).toBe(false)
  const values: number[] = []
  const dispose = autorun(() => values.push(projection.snapshot.context.count))
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  configure({ enforceActions: 'always' })
  const subscription = actor.subscribe(projection.update)
  try {
    actor.start()
    actor.send({ type: 'ADD' })
    expect(values).toEqual([0, 1])
    expect(projection.snapshot).toBe(actor.getSnapshot())
    expect(warning).not.toHaveBeenCalled()
    subscription.unsubscribe()
    actor.send({ type: 'ADD' })
    expect(values).toEqual([0, 1])
  } finally {
    configure({ enforceActions: 'observed' })
    warning.mockRestore()
    subscription.unsubscribe()
    dispose()
    actor.stop()
  }
})
