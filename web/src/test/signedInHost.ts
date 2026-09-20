import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createActor, fromPromise } from 'xstate'
import { vi } from 'vitest'
import { meLou } from '../../.storybook/fixtures'
import type { Me } from '../lib/types'
import { authMachine } from '../stores/authMachine'
import { createStores, type AppStores } from '../stores/createStores'

export type SignedInRoot = {
  host: HTMLDivElement
  root: Root
  stores: AppStores
}

export async function mountSignedInRoot(options?: { fakeTimers: true }): Promise<SignedInRoot> {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  if (options?.fakeTimers) {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  }
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  const authActor = createActor(
    authMachine.provide({
      actors: { loadMe: fromPromise(async (): Promise<Me | null> => meLou) },
      actions: { clearSessionAndFirebase: () => {} },
    }),
  )
  const stores = createStores(authActor)
  stores.retain()
  await stores.auth.refresh()
  return { host, root, stores }
}

export async function unmountSignedInRoot({ host, root, stores }: SignedInRoot): Promise<void> {
  await act(() => root.unmount())
  stores.auth.logout()
  stores.dispose()
  await Promise.resolve()
  host.remove()
  localStorage.clear()
  sessionStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
}
