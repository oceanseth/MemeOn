import { act, StrictMode, Suspense, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { configure, isObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import { createActor, fromPromise } from 'xstate'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ConnectedScenario } from '../../.storybook/connected-scenario'
import { maskyAccessToken, sessionToken } from '../lib/api'
import type { Me } from '../lib/types'
import { useAuthRuntime } from '../hooks/useAuthRuntime'
import { useMountEffect } from '../hooks/useMountEffect'
import { authMachine } from './authMachine'
import { createStores, type AppStores } from './createStores'
import { StoresProvider, useStores } from './StoresContext'

const adapters = vi.hoisted(() => ({
  firebase: vi.fn(),
  unsubscribeFirebase: vi.fn(),
  presence: vi.fn(),
  stopPresence: vi.fn(),
}))
vi.mock('../lib/firebase', () => ({
  firebaseSignOut: vi.fn(),
  onFirebaseUser: adapters.firebase,
}))
vi.mock('../lib/presence', () => ({ startPresence: adapters.presence }))

const me: Me = {
  sub: 'runtime-user', name: 'Runtime User', picture: null, coins: 42,
  portfolioValue: 0, collectionSize: 0, unreadAlerts: 0,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

function instrumentedStores() {
  const lifecycle = {
    starts: 0, stops: 0, subscriptions: 0, activeSubscriptions: 0,
    unsubscriptions: 0, invocations: 0, aborts: 0,
  }
  const trace: string[] = []
  const loads: Array<ReturnType<typeof deferred<Me | null>> & { signal: AbortSignal }> = []
  const actor = createActor(authMachine.provide({
    actors: {
      loadMe: fromPromise(({ signal }) => {
        lifecycle.invocations += 1
        signal.addEventListener('abort', () => { lifecycle.aborts += 1 }, { once: true })
        const load = { ...deferred<Me | null>(), signal }
        loads.push(load)
        return load.promise
      }),
    },
    actions: { clearSessionAndFirebase: () => {} },
  }))
  const start = actor.start.bind(actor)
  vi.spyOn(actor, 'start').mockImplementation(() => {
    trace.push('start')
    lifecycle.starts += 1
    return start()
  })
  const stop = actor.stop.bind(actor)
  vi.spyOn(actor, 'stop').mockImplementation(() => {
    lifecycle.stops += 1
    return stop()
  })
  const send = actor.send.bind(actor)
  vi.spyOn(actor, 'send').mockImplementation((event) => {
    trace.push(`send:${event.type}`)
    send(event)
  })
  const subscribe = actor.subscribe.bind(actor)
  vi.spyOn(actor, 'subscribe').mockImplementation((...args: Parameters<typeof actor.subscribe>) => {
    trace.push('subscribe')
    lifecycle.subscriptions += 1
    lifecycle.activeSubscriptions += 1
    const subscription = subscribe(...args)
    const unsubscribe = subscription.unsubscribe.bind(subscription)
    let active = true
    subscription.unsubscribe = () => {
      if (active) {
        active = false
        lifecycle.activeSubscriptions -= 1
        lifecycle.unsubscriptions += 1
      }
      unsubscribe()
    }
    return subscription
  })
  const stores = createStores(actor)
  const refreshes: Promise<void>[] = []
  const refresh = stores.auth.refresh.bind(stores.auth)
  vi.spyOn(stores.auth, 'refresh').mockImplementation(() => {
    const pending = refresh()
    refreshes.push(pending)
    return pending
  })
  const retain = stores.retain.bind(stores)
  vi.spyOn(stores, 'retain').mockImplementation(() => {
    trace.push('retain')
    retain()
  })
  return { stores, actor, lifecycle, trace, loads, refreshes }
}

type Record = ReturnType<typeof instrumentedStores>
let records: Record[]
let committed: AppStores[]
let host: HTMLDivElement
let root: Root

function factory() {
  const record = instrumentedStores()
  records.push(record)
  return record.stores
}

// Root and FreshStores both construct in useState and retain only after commit.
function OwnedStores({ children }: { children: ReactNode }) {
  const [stores] = useState(factory)
  useMountEffect(() => {
    committed.push(stores)
    stores.retain()
    return () => stores.dispose()
  })
  return <StoresProvider stores={stores}>{children}</StoresProvider>
}

function AuthRuntime() {
  useAuthRuntime()
  return null
}

const AuthProjection = observer(function AuthProjection() {
  const { auth } = useStores()
  return <output>{auth.loading ? 'loading' : auth.user?.name ?? 'logged out'}</output>
})

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request') }))
  localStorage.clear()
  sessionStorage.clear()
  adapters.firebase.mockImplementation((callback) => {
    callback({ uid: me.sub })
    return adapters.unsubscribeFirebase
  })
  adapters.presence.mockReturnValue(adapters.stopPresence)
  records = []
  committed = []
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(() => root.unmount())
  for (const record of records) record.stores.dispose()
  await Promise.resolve()
  host.remove()
  localStorage.clear()
  sessionStorage.clear()
  configure({ enforceActions: 'observed' })
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

it('starts only the committed StrictMode bag and owns one projection across replay', async () => {
  await act(() => root.render(<StrictMode><OwnedStores><AuthProjection /></OwnedStores></StrictMode>))
  expect(records).toHaveLength(2)
  expect(committed).toHaveLength(2)
  expect(committed[0]).toBe(committed[1])
  const kept = records.find(({ stores }) => stores === committed[0])!
  const discarded = records.find(({ stores }) => stores !== committed[0])!
  expect(discarded.lifecycle).toEqual({
    starts: 0, stops: 0, subscriptions: 0, activeSubscriptions: 0,
    unsubscriptions: 0, invocations: 0, aborts: 0,
  })
  expect(kept.lifecycle).toMatchObject({ starts: 1, stops: 0, subscriptions: 1, activeSubscriptions: 1 })

  let pending!: Promise<void>
  await act(() => { pending = kept.stores.auth.refresh() })
  expect(kept.lifecycle.invocations).toBe(1)
  await act(async () => { kept.loads[0]!.resolve(me); await pending })
  expect(host.textContent).toBe(me.name)
  expect(kept.lifecycle.activeSubscriptions).toBe(1)
  await act(() => root.unmount())
  expect(kept.lifecycle).toMatchObject({ starts: 1, stops: 1, activeSubscriptions: 0 })
  expect(kept.lifecycle.unsubscriptions).toBe(kept.lifecycle.subscriptions)
  expect(discarded.lifecycle.starts).toBe(0)
})

it('leaves abandoned Suspense renders inert even after queued microtasks and resolution', async () => {
  const suspended = deferred<void>()
  function Suspend(): ReactNode { throw suspended.promise }
  await act(() => root.render(
    <Suspense fallback={<p>waiting</p>}><OwnedStores><Suspend /></OwnedStores></Suspense>,
  ))
  expect(host.textContent).toBe('waiting')
  expect(records.length).toBeGreaterThan(0)
  expect(committed).toHaveLength(0)
  await act(async () => { await Promise.resolve(); await Promise.resolve() })
  await act(() => root.render(<p>replacement</p>))
  await act(async () => { suspended.resolve(); await suspended.promise })
  expect(host.textContent).toBe('replacement')
  for (const { lifecycle } of records) {
    expect(lifecycle).toEqual({
      starts: 0, stops: 0, subscriptions: 0, activeSubscriptions: 0,
      unsubscriptions: 0, invocations: 0, aborts: 0,
    })
  }
})

it('processes the actual child AuthRuntime refresh queued before parent retention', async () => {
  const warning = vi.spyOn(console, 'warn')
  configure({ enforceActions: 'always' })
  await act(() => root.render(
    <StrictMode><OwnedStores><AuthRuntime /><AuthProjection /></OwnedStores></StrictMode>,
  ))
  const kept = records.find(({ stores }) => stores === committed[0])!
  expect(kept.trace.indexOf('send:START')).toBeLessThan(kept.trace.indexOf('retain'))
  expect(kept.trace.indexOf('retain')).toBeLessThan(kept.trace.indexOf('start'))
  expect(kept.trace.filter((event) => event === 'subscribe')).toHaveLength(2)
  expect(kept.trace.lastIndexOf('subscribe')).toBeLessThan(kept.trace.indexOf('start'))
  expect(kept.lifecycle).toMatchObject({ starts: 1, stops: 0, invocations: 1, activeSubscriptions: 2 })
  expect(kept.refreshes).toHaveLength(1)
  expect(host.textContent).toBe('loading')
  expect(kept.stores.auth.snapshot).toBe(kept.actor.getSnapshot())
  expect(isObservable(kept.stores.auth.snapshot.context)).toBe(false)

  await act(async () => { kept.loads[0]!.resolve(me); await kept.refreshes[0] })
  expect(host.textContent).toBe(me.name)
  expect(kept.stores.auth.snapshot).toBe(kept.actor.getSnapshot())
  expect(kept.stores.auth.user).toBe(kept.actor.getSnapshot().context.user)
  expect(kept.lifecycle.activeSubscriptions).toBe(1)
  expect(warning).not.toHaveBeenCalled()
  expect(adapters.firebase).toHaveBeenCalledTimes(2)
  expect(adapters.unsubscribeFirebase).toHaveBeenCalledTimes(1)
  expect(adapters.presence).toHaveBeenCalledTimes(2)
  expect(adapters.stopPresence).toHaveBeenCalledTimes(1)

  await act(() => root.unmount())
  expect(kept.lifecycle).toMatchObject({ starts: 1, stops: 1, activeSubscriptions: 0 })
  expect(adapters.unsubscribeFirebase).toHaveBeenCalledTimes(2)
  expect(adapters.stopPresence).toHaveBeenCalledTimes(2)
})

it('keeps a committed FreshStores bag idle without fetching or invoking auth', async () => {
  await act(() => root.render(<OwnedStores><AuthProjection /></OwnedStores>))
  const record = records[0]!
  expect(record.lifecycle).toMatchObject({ starts: 1, subscriptions: 1, invocations: 0 })
  expect(record.actor.getSnapshot().matches('idle')).toBe(true)
  expect(fetch).not.toHaveBeenCalled()
  expect(adapters.firebase).not.toHaveBeenCalled()
  await act(() => root.unmount())
  expect(record.lifecycle).toMatchObject({ starts: 1, stops: 1, activeSubscriptions: 0 })
})

it('cancels pending actor work on true unmount and ignores a late result', async () => {
  await act(() => root.render(<StrictMode><OwnedStores><AuthProjection /></OwnedStores></StrictMode>))
  const record = records.find(({ stores }) => stores === committed[0])!
  await act(() => record.stores.auth.send({ type: 'START' }))
  const load = record.loads[0]!
  expect(load.signal.aborted).toBe(false)
  const snapshot = record.stores.auth.snapshot
  await act(() => root.unmount())
  expect(load.signal.aborted).toBe(true)
  expect(record.lifecycle).toMatchObject({ starts: 1, stops: 1, invocations: 1, aborts: 1, activeSubscriptions: 0 })
  expect(record.lifecycle.unsubscriptions).toBe(record.lifecycle.subscriptions)
  await act(async () => { load.resolve(me); await load.promise })
  expect(record.actor.getSnapshot().status).toBe('stopped')
  expect(record.stores.auth.snapshot).toBe(snapshot)
  expect(record.stores.auth.user).toBeNull()
  expect(host.textContent).toBe('')
})

it('starts an imperative connected scenario and settles refresh through logout before disposal', async () => {
  const scenario = new ConnectedScenario('auth-lifetime', { user: me })
  const connect = vi.spyOn(scenario.stores.auth, 'connect')
  const disconnect = vi.spyOn(scenario.stores.auth, 'disconnect')
  expect(scenario.stores.auth.snapshot.matches('idle')).toBe(true)
  expect(fetch).not.toHaveBeenCalled()
  const late = deferred<Response>()
  const response = Response.json(me)
  response.text = async () => JSON.stringify(me)
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(response).mockReturnValueOnce(late.promise)
  vi.stubGlobal('fetch', fetchMock)
  let disposed = false
  try {
    await scenario.start()
    expect(connect).toHaveBeenCalledOnce()
    expect(scenario.stores.auth.user).toEqual(me)
    const pending = scenario.stores.auth.refresh()
    const signal = fetchMock.mock.calls[1]![1]!.signal!
    expect(signal.aborted).toBe(false)
    expect(scenario.stores.auth.loading).toBe(false)
    scenario.dispose()
    disposed = true
    expect(scenario.stores.auth.user).toBeNull()
    expect(sessionToken()).toBeNull()
    expect(maskyAccessToken()).toBeNull()
    expect(signal.aborted).toBe(true)
    await expect(pending).resolves.toBeUndefined()
    expect(disconnect).toHaveBeenCalledOnce()
    const loggedOut = scenario.stores.auth.snapshot
    await act(async () => { late.resolve(response); await late.promise })
    expect(scenario.stores.auth.snapshot).toBe(loggedOut)
    expect(scenario.stores.auth.user).toBeNull()
  } finally {
    if (!disposed) scenario.dispose()
    await Promise.resolve()
  }
})
