import { createActor, fromPromise } from 'xstate'
import { expect, test, vi } from 'vitest'
import type { Me } from '../lib/types'
import { authMachine } from './authMachine'
import { createStores } from './createStores'

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

function storesWithLoadMe(loadMe: () => Promise<Me | null>) {
  const authActor = createActor(
    authMachine.provide({
      actors: { loadMe: fromPromise(loadMe) },
    }),
  )
  return { stores: createStores(authActor), authActor }
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

test('dispose without retain stops the actor after the current turn', async () => {
  const { stores, authActor } = storesWithLoadMe(async () => null)
  stores.retain()
  stores.dispose()
  await Promise.resolve()
  expect(authActor.getSnapshot().status).toBe('stopped')
})
