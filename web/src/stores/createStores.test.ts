import { createActor, fromPromise } from 'xstate'
import { autorun, configure, isObservable } from 'mobx'
import { afterEach, expect, test, vi } from 'vitest'
import type { Me } from '../lib/types'
import { AuthStore } from './AuthStore'
import { authMachine } from './authMachine'
import { createStores } from './createStores'
import { ThemeStore } from './themeStore'

vi.mock('../lib/firebase', () => ({
  firebaseSignOut: () => {},
}))

const me: Me = {
  sub: 'user-test',
  name: 'test',
  picture: null,
  coins: 0,
  portfolioValue: 0,
  collectionSize: 0,
  unreadAlerts: 0,
}

const owned: ReturnType<typeof createStores>[] = []

afterEach(async () => {
  for (const stores of owned.splice(0)) stores.dispose()
  await Promise.resolve()
  vi.restoreAllMocks()
})

function storesWithLoadMe(loadMe: () => Promise<Me | null>, theme?: ThemeStore) {
  const authActor = createActor(
    authMachine.provide({
      actors: { loadMe: fromPromise(loadMe) },
      actions: { clearSessionAndFirebase: () => {} },
    }),
  )
  const stores = createStores(authActor, theme)
  owned.push(stores)
  return { stores, authActor }
}

test('refresh settles after dispose then retain (StrictMode remount)', async () => {
  let finish!: (user: Me | null) => void
  const loadMe = () =>
    new Promise<Me | null>((resolve) => {
      finish = resolve
    })
  const { stores, authActor } = storesWithLoadMe(loadMe)

  stores.retain()
  const pending = stores.auth.refresh()
  expect(stores.auth.loading).toBe(true)

  stores.dispose()
  stores.retain()
  finish(me)

  await pending
  expect(stores.auth.loading).toBe(false)
  expect(stores.auth.user?.sub).toBe('user-test')
  expect(authActor.getSnapshot().status).toBe('active')
})

test('disposal without renewed retention stops the actor after the current turn', async () => {
  const { stores, authActor } = storesWithLoadMe(async () => null)
  stores.retain()
  stores.dispose()
  await Promise.resolve()
  expect(authActor.getSnapshot().status).toBe('stopped')
})

test('imperative retention starts once and repeated disposal disconnects and stops once', async () => {
  const loadMe = vi.fn(async () => me)
  const { stores, authActor } = storesWithLoadMe(loadMe)
  const start = vi.spyOn(authActor, 'start')
  const stop = vi.spyOn(authActor, 'stop')
  const subscribe = vi.spyOn(authActor, 'subscribe')
  stores.retain()
  stores.retain()
  expect(start).toHaveBeenCalledOnce()
  expect(subscribe).toHaveBeenCalledOnce()
  const unsubscribe = vi.spyOn(subscribe.mock.results[0]!.value, 'unsubscribe')
  expect(loadMe).not.toHaveBeenCalled()
  await stores.auth.refresh()
  expect(stores.auth.user).toBe(me)

  stores.dispose()
  stores.dispose()
  expect(unsubscribe).not.toHaveBeenCalled()
  expect(stop).not.toHaveBeenCalled()
  await Promise.resolve()
  expect(unsubscribe).toHaveBeenCalledOnce()
  expect(stop).toHaveBeenCalledOnce()
  expect(authActor.getSnapshot().status).toBe('stopped')
  stores.retain()
  expect(start).toHaveBeenCalledOnce()
})

test('disposing an unretained bag acquires no actor resources', async () => {
  const { stores, authActor } = storesWithLoadMe(async () => null)
  const start = vi.spyOn(authActor, 'start')
  const stop = vi.spyOn(authActor, 'stop')
  const subscribe = vi.spyOn(authActor, 'subscribe')
  stores.dispose()
  await Promise.resolve()
  expect(start).not.toHaveBeenCalled()
  expect(stop).not.toHaveBeenCalled()
  expect(subscribe).not.toHaveBeenCalled()
})

test('projection connection catches up by exact reference inside an action and is reversible', async () => {
  const actor = createActor(authMachine.provide({
    actors: { loadMe: fromPromise<Me | null>(async () => me) },
    actions: { clearSessionAndFirebase: () => {} },
  }))
  const subscribe = vi.spyOn(actor, 'subscribe')
  const auth = new AuthStore(actor)
  const initial = actor.getSnapshot()
  expect(auth.snapshot).toBe(initial)
  expect(isObservable(auth.snapshot.context)).toBe(false)
  expect(subscribe).not.toHaveBeenCalled()
  const observed: unknown[] = []
  const unobserve = autorun(() => observed.push(auth.snapshot))
  const warning = vi.spyOn(console, 'warn')
  configure({ enforceActions: 'always' })
  try {
    actor.start()
    actor.send({ type: 'LOGOUT' })
    const beforeConnect = actor.getSnapshot()
    expect(auth.snapshot).toBe(initial)
    auth.connect()
    auth.connect()
    expect(subscribe).toHaveBeenCalledOnce()
    expect(auth.snapshot).toBe(beforeConnect)
    expect(observed).toEqual([initial, beforeConnect])
    const unsubscribe = vi.spyOn(subscribe.mock.results[0]!.value, 'unsubscribe')
    await auth.refresh()
    expect(auth.snapshot).toBe(actor.getSnapshot())
    expect(auth.user).toBe(me)
    auth.disconnect()
    auth.disconnect()
    expect(unsubscribe).toHaveBeenCalledOnce()
    const disconnected = auth.snapshot
    actor.send({ type: 'LOGOUT' })
    expect(auth.snapshot).toBe(disconnected)
    auth.connect()
    expect(auth.snapshot).toBe(actor.getSnapshot())
    expect(auth.user).toBeNull()
    expect(warning).not.toHaveBeenCalled()
  } finally {
    unobserve()
    auth.disconnect()
    actor.stop()
    configure({ enforceActions: 'observed' })
  }
})

test('retaining binds the theme to the signed-in avatar and disposal stops following it', async () => {
  const items = new Map([['memeon_theme', 'light'], ['memeon_theme:user-test', 'dark']])
  const dataset: Record<string, string | undefined> = {}
  const theme = new ThemeStore({
    document: { documentElement: { dataset } },
    localStorage: {
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => { items.set(key, value) },
    },
  })
  const disconnect = vi.spyOn(theme, 'disconnect')
  const { stores } = storesWithLoadMe(async () => me, theme)
  expect(stores.theme).toBe(theme)
  expect(dataset).toEqual({})

  stores.retain()
  expect(dataset.theme).toBe('light')
  await stores.auth.refresh()
  expect(dataset.theme).toBe('dark')
  stores.auth.logout()
  expect(stores.auth.user).toBeNull()
  expect(dataset.theme).toBe('light')

  stores.dispose()
  expect(disconnect).not.toHaveBeenCalled()
  await Promise.resolve()
  expect(disconnect).toHaveBeenCalledOnce()
})

test('a bag constructed in node carries an inert theme store that never throws', () => {
  const { stores } = storesWithLoadMe(async () => null)
  expect(stores.theme.preference).toBe('auto')
  expect(stores.theme.resolved).toBe('light')
  stores.retain()
  stores.theme.setPreference('dark')
  expect(stores.theme.resolved).toBe('dark')
})
