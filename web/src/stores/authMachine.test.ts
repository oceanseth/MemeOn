import { createActor } from 'xstate'
import { autorun, configure, isObservable } from 'mobx'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  maskyAccessToken,
  sessionToken,
  setMaskyAccessToken,
  setSessionToken,
} from '../lib/api'
import { firebaseSignOut } from '../lib/firebase'
import type { Me } from '../lib/types'
import { authMachine } from './authMachine'
import { createStores } from './createStores'

vi.mock('../lib/firebase', () => ({ firebaseSignOut: vi.fn() }))

const me: Me = {
  sub: 'logout-user',
  name: 'Logout User',
  picture: null,
  coins: 42,
  portfolioValue: 0,
  collectionSize: 0,
  unreadAlerts: 0,
}

function deferredResponse() {
  let resolve!: (response: Response) => void
  let reject!: (error: Error) => void
  const promise = new Promise<Response>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

function settleLate(result: 'success' | 'network failure' | '401', response: ReturnType<typeof deferredResponse>) {
  if (result === 'success') response.resolve(Response.json({ ...me, coins: 42 }))
  else if (result === '401') response.resolve(Response.json({ error: 'expired' }, { status: 401 }))
  else response.reject(new Error('account unavailable'))
}

const fetchMock = vi.fn<typeof fetch>()
let actor: ReturnType<typeof createActor<typeof authMachine>>
let stores: ReturnType<typeof createStores>

beforeEach(() => {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
  vi.stubGlobal('fetch', fetchMock)
  setSessionToken('old-session')
  setMaskyAccessToken('old-masky-token')
  actor = createActor(authMachine)
  stores = createStores(actor)
  stores.retain()
})

afterEach(async () => {
  stores.dispose()
  await Promise.resolve()
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

async function authenticate() {
  fetchMock.mockResolvedValueOnce(Response.json(me))
  await stores.auth.refresh()
  expect(stores.auth.user).toEqual(me)
}

test('auth projects exact snapshots and action-safe observed updates', async () => {
  expect(stores.auth.snapshot).toBe(actor.getSnapshot())
  expect(isObservable(stores.auth.snapshot.context)).toBe(false)
  const observed: Array<string | null> = []
  const dispose = autorun(() => observed.push(stores.auth.user?.sub ?? null))
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  configure({ enforceActions: 'always' })
  try {
    await authenticate()
    expect(stores.auth.snapshot).toBe(actor.getSnapshot())
    expect(stores.auth.user).toBe(actor.getSnapshot().context.user)
    stores.auth.logout()
    expect(observed).toEqual([null, me.sub, null])
    expect(warning).not.toHaveBeenCalled()
  } finally {
    dispose()
    warning.mockRestore()
    configure({ enforceActions: 'observed' })
  }
})

function expectLoggedOut() {
  expect(stores.auth.user).toBeNull()
  expect(stores.auth.loading).toBe(false)
  expect(stores.auth.snapshot.context.error).toBeNull()
  expect(sessionToken()).toBeNull()
  expect(maskyAccessToken()).toBeNull()
  expect(firebaseSignOut).toHaveBeenCalledOnce()
}

test('logout immediately clears the authenticated user and both credentials', async () => {
  await authenticate()
  stores.auth.logout()
  expectLoggedOut()
})

test('logout clears credentials before initial authentication starts', () => {
  stores.auth.logout()
  expectLoggedOut()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('logout clears the error after a failed authentication attempt', async () => {
  fetchMock.mockRejectedValueOnce(new Error('network unavailable'))
  await stores.auth.refresh()
  expect(stores.auth.snapshot.context.error).toBe('network unavailable')
  stores.auth.logout()
  expectLoggedOut()
})

for (const phase of ['startup', 'refresh'] as const) {
  test.each(['success', 'network failure', '401'] as const)(
    `logout during ${phase} ignores a late %s and settles the pending refresh`,
    async (result) => {
      if (phase === 'refresh') await authenticate()
      const response = deferredResponse()
      fetchMock.mockReturnValueOnce(response.promise)
      const pending = stores.auth.refresh()
      void pending.catch(() => {})

      stores.auth.logout()
      expectLoggedOut()
      expect(fetchMock.mock.calls.at(-1)?.[1]?.signal?.aborted).toBe(true)
      await pending

      if (result === 'success') response.resolve(Response.json(me))
      else if (result === '401') response.resolve(Response.json({ error: 'expired' }, { status: 401 }))
      else response.reject(new Error('network unavailable'))
      // Drain the canceled fetch and JSON parsing before checking for stale updates.
      await new Promise((resolve) => setTimeout(resolve, 0))
      expectLoggedOut()
    },
  )
}

test('a canceled refresh returning 401 cannot clear a subsequent login', async () => {
  await authenticate()
  const oldResponse = deferredResponse()
  fetchMock.mockReturnValueOnce(oldResponse.promise)
  const pending = stores.auth.refresh()
  stores.auth.logout()

  setSessionToken('new-session')
  setMaskyAccessToken('new-masky-token')
  const nextUser = { ...me, sub: 'next-user' }
  fetchMock.mockResolvedValueOnce(Response.json(nextUser))
  await stores.auth.refresh()
  expect(stores.auth.user).toEqual(nextUser)

  oldResponse.resolve(Response.json({ error: 'expired' }, { status: 401 }))
  await pending
  await new Promise((resolve) => setTimeout(resolve, 0))

  expect(stores.auth.user).toEqual(nextUser)
  expect(sessionToken()).toBe('new-session')
  expect(maskyAccessToken()).toBe('new-masky-token')
})

test.each(['startup', 'refresh'] as const)('%s returning 401 clears invalid credentials', async (phase) => {
  if (phase === 'refresh') await authenticate()
  fetchMock.mockResolvedValueOnce(Response.json({ error: 'expired' }, { status: 401 }))
  await stores.auth.refresh()
  expect(stores.auth.user).toBeNull()
  expect(stores.auth.loading).toBe(false)
  expect(stores.auth.error).toBeNull()
  expect(sessionToken()).toBeNull()
  expect(maskyAccessToken()).toBeNull()
})

test('initial authentication gates protected routes until the user is loaded', async () => {
  expect(stores.auth.loading).toBe(true)
  const response = deferredResponse()
  fetchMock.mockReturnValueOnce(response.promise)
  const pending = stores.auth.refresh()
  void pending.catch(() => {})
  expect(stores.auth.user).toBeNull()
  expect(stores.auth.loading).toBe(true)

  response.resolve(Response.json(me))
  await pending
  expect(stores.auth.user).toEqual(me)
  expect(stores.auth.loading).toBe(false)
})

test('background refresh keeps the authenticated projection usable while awaiting the response', async () => {
  await authenticate()
  const response = deferredResponse()
  fetchMock.mockReturnValueOnce(response.promise)
  const pending = stores.auth.refresh()
  let settled = false
  void pending.then(() => { settled = true }, () => {})

  expect(stores.auth.loading).toBe(false)
  expect(stores.auth.user).toEqual(me)
  await Promise.resolve()
  expect(settled).toBe(false)

  const updated = { ...me, coins: me.coins + 1 }
  response.resolve(Response.json(updated))
  await pending
  expect(settled).toBe(true)
  expect(stores.auth.user).toEqual(updated)
  expect(stores.auth.loading).toBe(false)
})

test.each(['success', 'network failure', '401'] as const)(
  'a replacement refresh prevents a late %s response from winning',
  async (lateResult) => {
    await authenticate()
    const first = deferredResponse()
    fetchMock.mockReturnValueOnce(first.promise)
    const firstWaiter = stores.auth.refresh()
    const firstSignal = fetchMock.mock.calls.at(-1)?.[1]?.signal

    const second = deferredResponse()
    fetchMock.mockReturnValueOnce(second.promise)
    const secondWaiter = stores.auth.refresh()
    expect(firstSignal?.aborted).toBe(true)

    let settled = false
    void Promise.all([firstWaiter, secondWaiter]).then(() => { settled = true })
    settleLate(lateResult, first)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(settled).toBe(false)
    expect(stores.auth.user).toEqual(me)

    const updated = { ...me, coins: 52 }
    second.resolve(Response.json(updated))
    await Promise.all([firstWaiter, secondWaiter])
    expect(stores.auth.user).toEqual(updated)
    expect(sessionToken()).toBe('old-session')
    expect(maskyAccessToken()).toBe('old-masky-token')
  },
)

test.each(['success', 'network failure', '401'] as const)(
  'a late superseded %s response cannot overwrite a completed replacement',
  async (lateResult) => {
    await authenticate()
    const first = deferredResponse()
    fetchMock.mockReturnValueOnce(first.promise)
    const firstWaiter = stores.auth.refresh()
    const firstSignal = fetchMock.mock.calls.at(-1)?.[1]?.signal
    const second = deferredResponse()
    fetchMock.mockReturnValueOnce(second.promise)
    const secondWaiter = stores.auth.refresh()
    expect(firstSignal?.aborted).toBe(true)

    const updated = { ...me, coins: 52 }
    second.resolve(Response.json(updated))
    await Promise.all([firstWaiter, secondWaiter])
    settleLate(lateResult, first)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(stores.auth.user).toEqual(updated)
    expect(sessionToken()).toBe('old-session')
    expect(maskyAccessToken()).toBe('old-masky-token')
  },
)

test.each(['transient failure', '401', 'logout'] as const)(
  'both replacement refresh waiters settle when the latest request ends in %s',
  async (latestOutcome) => {
    await authenticate()
    const first = deferredResponse()
    fetchMock.mockReturnValueOnce(first.promise)
    const firstWaiter = stores.auth.refresh()
    const second = deferredResponse()
    fetchMock.mockReturnValueOnce(second.promise)
    const secondWaiter = stores.auth.refresh()

    if (latestOutcome === 'transient failure') second.reject(new Error('account unavailable'))
    else if (latestOutcome === '401') second.resolve(Response.json({ error: 'expired' }, { status: 401 }))
    else stores.auth.logout()
    await Promise.all([firstWaiter, secondWaiter])

    if (latestOutcome === 'transient failure') {
      expect(stores.auth.user).toEqual(me)
      expect(stores.auth.error).toBe('account unavailable')
      expect(sessionToken()).toBe('old-session')
    } else if (latestOutcome === '401') {
      expect(stores.auth.user).toBeNull()
      expect(sessionToken()).toBeNull()
      expect(maskyAccessToken()).toBeNull()
    } else {
      expectLoggedOut()
    }

    settleLate('401', first)
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (latestOutcome === 'transient failure') {
      expect(stores.auth.user).toEqual(me)
      expect(sessionToken()).toBe('old-session')
    } else if (latestOutcome === '401') {
      expect(stores.auth.user).toBeNull()
      expect(sessionToken()).toBeNull()
      expect(maskyAccessToken()).toBeNull()
    } else {
      expectLoggedOut()
    }
  },
)

for (const failure of ['network', '503'] as const) {
  function failAccountRequest() {
    if (failure === 'network') fetchMock.mockRejectedValueOnce(new Error('account unavailable'))
    else fetchMock.mockResolvedValueOnce(Response.json({ error: 'account unavailable' }, { status: 503 }))
  }

  test(`startup ${failure} failure settles in error without a user and can retry`, async () => {
    failAccountRequest()
    await stores.auth.refresh()
    expect(stores.auth.user).toBeNull()
    expect(stores.auth.loading).toBe(false)
    expect(stores.auth.snapshot.matches('error')).toBe(true)
    expect(stores.auth.error).toBe('account unavailable')
    expect(sessionToken()).toBe('old-session')
    expect(maskyAccessToken()).toBe('old-masky-token')

    await authenticate()
    expect(stores.auth.error).toBeNull()
  })

  test(`refresh ${failure} failure preserves the current user and clears its error on retry`, async () => {
    await authenticate()
    failAccountRequest()
    await stores.auth.refresh()
    expect(stores.auth.user).toEqual(me)
    expect(stores.auth.loading).toBe(false)
    expect(stores.auth.snapshot.matches('ready')).toBe(true)
    expect(stores.auth.error).toBe('account unavailable')
    expect(sessionToken()).toBe('old-session')
    expect(maskyAccessToken()).toBe('old-masky-token')

    const updated = { ...me, coins: me.coins + 1 }
    fetchMock.mockResolvedValueOnce(Response.json(updated))
    await stores.auth.refresh()
    expect(stores.auth.user).toEqual(updated)
    expect(stores.auth.error).toBeNull()
  })
}
