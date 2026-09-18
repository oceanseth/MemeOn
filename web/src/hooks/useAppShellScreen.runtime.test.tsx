import { act, StrictMode, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { createActor, fromPromise } from 'xstate'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  FIXED_NOW,
  meLou,
  questStepsFresh,
  readSale,
  unreadSale,
} from '../../.storybook/fixtures'
import type { Alert, Me, QuestKey } from '../lib/types'
import { authMachine } from '../stores/authMachine'
import { createStores, type AppStores } from '../stores/createStores'
import { StoresProvider } from '../stores/StoresContext'
import { useAppShellScreen } from './useAppShellScreen'

vi.mock('../lib/firebase', () => ({ firebaseSignOut: vi.fn() }))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

type AuthLoad = ReturnType<typeof deferred<Me | null>>

function createControlledStores() {
  const loads: AuthLoad[] = []
  const actor = createActor(authMachine.provide({
    actors: {
      loadMe: fromPromise(() => {
        const load = deferred<Me | null>()
        loads.push(load)
        return load.promise
      }),
    },
    actions: { clearSessionAndFirebase: () => {} },
  }))
  const stores = createStores(actor)
  stores.retain()
  return { stores, loads }
}

function pathOf(input: RequestInfo | URL): string {
  const value = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url
  return new URL(value, window.location.origin).pathname
}

function controlledShellReads() {
  const alerts: Array<ReturnType<typeof deferred<Response>>> = []
  const steps: Array<ReturnType<typeof deferred<Response>>> = []
  const fetchMock = vi.fn<typeof fetch>((input) => {
    const path = pathOf(input)
    if (path === '/api/alerts') {
      const request = deferred<Response>()
      alerts.push(request)
      return request.promise
    }
    if (path === '/api/onboarding') {
      const request = deferred<Response>()
      steps.push(request)
      return request.promise
    }
    throw new Error(`Unexpected request: ${path}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return { alerts, steps, fetchMock }
}

const Probe = observer(function Probe() {
  const model = useAppShellScreen()
  return (
    <section>
      <output data-testid="phase">{model.phase}</output>
      <output data-testid="alerts">{model.alertsBell.rows.map((row) => row.message).join('|')}</output>
      <output data-testid="unread">{model.alertsBell.unreadLabel ?? '0'}</output>
      <output data-testid="quest">{model.questBar?.completionLabel ?? 'none'}</output>
    </section>
  )
})

function mountedProbe(stores: AppStores, children: ReactNode = <Probe />) {
  return (
    <StoresProvider stores={stores}>
      <MemoryRouter>{children}</MemoryRouter>
    </StoresProvider>
  )
}

function text(host: HTMLElement, testId: string): string {
  return host.querySelector(`[data-testid="${testId}"]`)?.textContent ?? ''
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

async function refreshAs(
  stores: AppStores,
  loads: AuthLoad[],
  user: Me,
): Promise<void> {
  let refresh!: Promise<void>
  const index = loads.length
  await act(() => { refresh = stores.auth.refresh() })
  expect(loads).toHaveLength(index + 1)
  await act(async () => {
    loads[index]!.resolve(user)
    await refresh
  })
}

function allDoneUser(name: string): Me {
  const onboarding = Object.fromEntries(
    (['pack', 'mint', 'share', 'friend', 'trade'] satisfies QuestKey[]).map((key) => [key, 'done']),
  )
  return { ...meLou, name, onboarding }
}

function alert(message: string, read: boolean): Alert {
  return { ...(read ? readSale : unreadSale), id: message, message, read }
}

let host: HTMLDivElement
let root: Root
let storesToDispose: AppStores[]

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  storesToDispose = []
})

afterEach(async () => {
  await act(() => root.unmount())
  for (const stores of storesToDispose) {
    stores.auth.logout()
    stores.dispose()
  }
  await Promise.resolve()
  host.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('keeps the newest same-account alerts and onboarding projection when older reads settle last', async () => {
  const { stores, loads } = createControlledStores()
  storesToDispose.push(stores)
  const reads = controlledShellReads()
  const userA = { ...meLou, name: 'Account read A', onboarding: { pack: 'todo' } }
  const userB = { ...userA, name: 'Account read B' }
  await refreshAs(stores, loads, userA)

  await act(() => root.render(mountedProbe(stores)))
  expect(reads.alerts).toHaveLength(1)
  expect(reads.steps).toHaveLength(1)

  await refreshAs(stores, loads, userB)
  expect(userB.sub).toBe(userA.sub)
  expect(reads.alerts).toHaveLength(2)
  expect(reads.steps).toHaveLength(2)

  const completedSteps = questStepsFresh.map((step) => ({ ...step, done: true }))
  await act(async () => {
    reads.alerts[1]!.resolve(Response.json({ alerts: [alert('Current read alert', true)] }))
    reads.steps[1]!.resolve(Response.json({ steps: completedSteps }))
    await settle()
  })
  expect(text(host, 'phase')).toBe('loggedIn')
  expect(text(host, 'alerts')).toBe('Current read alert')
  expect(text(host, 'unread')).toBe('0')
  expect(text(host, 'quest')).toBe('5/5')

  await act(async () => {
    reads.alerts[0]!.resolve(Response.json({ alerts: [alert('Old unread alert', false)] }))
    reads.steps[0]!.resolve(Response.json({ steps: questStepsFresh }))
    await settle()
  })
  expect(text(host, 'alerts')).toBe('Current read alert')
  expect(text(host, 'unread')).toBe('0')
  expect(text(host, 'quest')).toBe('5/5')
})

it('invalidates pending reads across StrictMode logout, all-done login, and true unmount', async () => {
  const { stores, loads } = createControlledStores()
  storesToDispose.push(stores)
  const reads = controlledShellReads()
  const userA = { ...meLou, name: 'Pending account', onboarding: { pack: 'todo' } }
  await refreshAs(stores, loads, userA)

  await act(() => root.render(mountedProbe(stores, <StrictMode><Probe /></StrictMode>)))
  const pendingAAlerts = [...reads.alerts]
  const pendingASteps = [...reads.steps]
  expect(pendingAAlerts.length).toBeGreaterThan(0)
  expect(pendingASteps.length).toBeGreaterThan(0)

  await act(() => stores.auth.logout())
  expect(text(host, 'phase')).toBe('loggedOut')
  const userB = allDoneUser('Completed account')
  await refreshAs(stores, loads, userB)
  const userBAlert = reads.alerts.at(-1)!
  expect(reads.steps).toHaveLength(pendingASteps.length)
  await act(async () => {
    userBAlert.resolve(Response.json({ alerts: [alert('Completed account alert', true)] }))
    await settle()
  })

  await act(async () => {
    for (const request of pendingAAlerts) {
      request.resolve(Response.json({ alerts: [alert('Logged-out stale alert', false)] }))
    }
    for (const request of pendingASteps) {
      request.resolve(Response.json({ steps: questStepsFresh }))
    }
    await settle()
  })
  expect(text(host, 'alerts')).toBe('Completed account alert')
  expect(text(host, 'unread')).toBe('0')
  expect(text(host, 'quest')).toBe('none')

  const userC = { ...meLou, name: 'Unmounted account', onboarding: { pack: 'todo' } }
  await refreshAs(stores, loads, userC)
  const pendingCAlert = reads.alerts.at(-1)!
  const pendingCSteps = reads.steps.at(-1)!
  expect(text(host, 'quest')).toBe('none')
  await act(() => root.unmount())
  await act(async () => {
    pendingCAlert.resolve(Response.json({ alerts: [alert('Unmounted alert', false)] }))
    pendingCSteps.resolve(Response.json({ steps: questStepsFresh }))
    await settle()
  })
  expect(host.textContent).toBe('')
})

it('polls every thirty seconds, resets only for a new user reference, and stops after logout or unmount', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(FIXED_NOW))
  const { stores, loads } = createControlledStores()
  storesToDispose.push(stores)
  const alerts = vi.fn()
  vi.stubGlobal('fetch', vi.fn<typeof fetch>((input) => {
    const path = pathOf(input)
    if (path !== '/api/alerts') throw new Error(`Unexpected request: ${path}`)
    alerts()
    return Promise.resolve(Response.json({ alerts: [alert('Polling alert', true)] }))
  }))
  const userA = allDoneUser('Polling account A')
  await refreshAs(stores, loads, userA)
  await act(async () => {
    root.render(mountedProbe(stores))
    await settle()
  })
  expect(alerts).toHaveBeenCalledTimes(1)

  await act(async () => {
    vi.advanceTimersByTime(30_000)
    await settle()
  })
  expect(alerts).toHaveBeenCalledTimes(2)

  let unchangedRefresh!: Promise<void>
  const unchangedIndex = loads.length
  await act(() => { unchangedRefresh = stores.auth.refresh() })
  await act(async () => {
    loads[unchangedIndex]!.reject(new Error('transient refresh failure'))
    await unchangedRefresh
  })
  expect(stores.auth.user).toBe(userA)
  expect(alerts).toHaveBeenCalledTimes(2)

  await act(() => vi.advanceTimersByTime(15_000))
  const userB = allDoneUser('Polling account B')
  await refreshAs(stores, loads, userB)
  expect(alerts).toHaveBeenCalledTimes(3)
  await act(async () => {
    vi.advanceTimersByTime(15_000)
    await settle()
  })
  expect(alerts).toHaveBeenCalledTimes(3)
  await act(async () => {
    vi.advanceTimersByTime(15_000)
    await settle()
  })
  expect(alerts).toHaveBeenCalledTimes(4)

  await act(() => stores.auth.logout())
  await act(() => vi.advanceTimersByTime(60_000))
  expect(alerts).toHaveBeenCalledTimes(4)

  await refreshAs(stores, loads, allDoneUser('Polling account C'))
  expect(alerts).toHaveBeenCalledTimes(5)
  await act(() => root.unmount())
  await act(() => vi.advanceTimersByTime(60_000))
  expect(alerts).toHaveBeenCalledTimes(5)
})
