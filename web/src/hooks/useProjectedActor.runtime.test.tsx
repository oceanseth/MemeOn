import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { observer } from 'mobx-react-lite'
import { Actor, assign, fromCallback, setup, type ActorRefFrom } from 'xstate'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useProjectedActor } from './useProjectedActor'
import { ActorSnapshotProjection } from '../stores/ActorSnapshotProjection'

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

function counter() {
  const lifecycle = { starts: 0, stops: 0 }
  const machine = setup({
    types: { context: {} as { count: number }, events: {} as { type: 'ADD' } },
    actors: {
      resource: fromCallback(({ sendBack }) => {
        lifecycle.starts += 1
        sendBack({ type: 'ADD' })
        return () => { lifecycle.stops += 1 }
      }),
    },
  }).createMachine({
    context: { count: 0 },
    invoke: { src: 'resource' },
    on: { ADD: { actions: assign({ count: ({ context }) => context.count + 1 }) } },
  })
  return { machine, lifecycle }
}

it('updates an observer through MobX, catches startup events, and isolates independent mounts', async () => {
  const { machine, lifecycle } = counter()
  const actors = new Map<string, ActorRefFrom<typeof machine>>()
  function Probe({ id }: { id: string }) {
    const [snapshot, , actor] = useProjectedActor(machine)
    actors.set(id, actor)
    return <output data-testid={id}>{snapshot.context.count}</output>
  }
  const ObservedProbe = observer(Probe)
  await act(() => root.render(<><ObservedProbe id="a" /><ObservedProbe id="b" /><Probe id="plain" /></>))
  expect(host.querySelector('[data-testid=a]')?.textContent).toBe('1')
  expect(host.querySelector('[data-testid=b]')?.textContent).toBe('1')
  // The plain consumer never subscribes React to XState snapshots.
  expect(host.querySelector('[data-testid=plain]')?.textContent).toBe('0')
  expect(actors.get('a')).not.toBe(actors.get('b'))
  await act(() => { actors.get('a')!.send({ type: 'ADD' }); actors.get('plain')!.send({ type: 'ADD' }) })
  expect(host.querySelector('[data-testid=a]')?.textContent).toBe('2')
  expect(host.querySelector('[data-testid=b]')?.textContent).toBe('1')
  expect(host.querySelector('[data-testid=plain]')?.textContent).toBe('0')
  expect(lifecycle).toEqual({ starts: 3, stops: 0 })
})

it('cleans subscriptions and invoked resources through StrictMode and keyed route resets', async () => {
  const { machine, lifecycle } = counter()
  const actors = new Map<string, ActorRefFrom<typeof machine>>()
  const update = vi.spyOn(ActorSnapshotProjection.prototype, 'update')
  const Probe = observer(function Probe({ route }: { route: string }) {
    const [snapshot, , actor] = useProjectedActor(machine)
    actors.set(route, actor)
    return <output>{route}:{snapshot.context.count}</output>
  })
  const render = (route: string) => root.render(<StrictMode><Probe key={route} route={route} /></StrictMode>)
  await act(() => render('a'))
  expect(lifecycle.starts - lifecycle.stops).toBe(1)
  const first = actors.get('a')!
  await act(() => first.send({ type: 'ADD' }))
  expect(host.textContent).toBe(`a:${first.getSnapshot().context.count}`)
  await act(() => render('a'))
  expect(actors.get('a')).toBe(first)
  await act(() => render('b'))
  expect(actors.get('b')).not.toBe(first)
  expect(lifecycle.starts - lifecycle.stops).toBe(1)
  expect(host.textContent).toBe(`b:${actors.get('b')!.getSnapshot().context.count}`)
  await act(() => root.unmount())
  expect(lifecycle.stops).toBe(lifecycle.starts)
  const calls = update.mock.calls.length
  // XState's StrictMode stop restores its public snapshot; stopped resources prove disposal.
  await act(() => { first.send({ type: 'ADD' }); actors.get('b')!.send({ type: 'ADD' }) })
  expect(update).toHaveBeenCalledTimes(calls)
})

it('starts no resource or subscription during an abandoned render', () => {
  const { machine, lifecycle } = counter()
  const subscribe = vi.spyOn(Actor.prototype, 'subscribe')
  const update = vi.spyOn(ActorSnapshotProjection.prototype, 'update')
  function Probe() {
    const [snapshot] = useProjectedActor(machine)
    return <output>{snapshot.context.count}</output>
  }
  renderToString(<StrictMode><Probe /></StrictMode>)
  expect(lifecycle).toEqual({ starts: 0, stops: 0 })
  expect(subscribe).not.toHaveBeenCalled()
  expect(update).not.toHaveBeenCalled()
})
