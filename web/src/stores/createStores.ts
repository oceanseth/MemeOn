import { reaction } from 'mobx'
import { createActor, type ActorRefFrom } from 'xstate'
import { AuthStore } from './AuthStore'
import { authMachine } from './authMachine'
import { ThemeStore } from './themeStore'

export type AppStores = ReturnType<typeof createStores>

/**
 * Inert app / story store bag. A committed mount or imperative owner must
 * retain it before use. Retaining also cancels a queued disposal during
 * StrictMode replay; it is not reference counting or a restart after disposal.
 *
 * The theme store rides along: `retain()` connects it (it starts following the
 * OS setting) and binds it to the signed-in avatar through a reaction on
 * `auth.user`, so a login re-reads that avatar's persisted choice and a logout
 * falls back to the device's. Disposal stops the reaction and the listener.
 */
export function createStores(
  authActor: ActorRefFrom<typeof authMachine> = createActor(authMachine),
  theme: ThemeStore = new ThemeStore(),
) {
  const auth = new AuthStore(authActor)
  let lifecycle: 'unretained' | 'retained' | 'disposed' = 'unretained'
  let disposeGen = 0
  let stopThemeSync: (() => void) | undefined
  return {
    auth,
    theme,
    retain() {
      if (lifecycle === 'disposed') return
      disposeGen += 1
      if (lifecycle === 'retained') return
      lifecycle = 'retained'
      auth.connect()
      theme.connect()
      stopThemeSync = reaction(
        () => auth.user?.sub ?? null,
        (sub) => theme.bindUser(sub),
        { fireImmediately: true },
      )
      authActor.start()
    },
    dispose() {
      const gen = disposeGen
      queueMicrotask(() => {
        if (gen !== disposeGen || lifecycle === 'disposed') return
        const wasRetained = lifecycle === 'retained'
        lifecycle = 'disposed'
        stopThemeSync?.()
        stopThemeSync = undefined
        theme.disconnect()
        auth.disconnect()
        if (wasRetained && authActor.getSnapshot().status === 'active') authActor.stop()
      })
    },
  }
}
