import { createActor, type ActorRefFrom } from 'xstate'
import { AuthStore } from './AuthStore'
import { authMachine } from './authMachine'

export type AppStores = ReturnType<typeof createStores>

/**
 * Inert app / story store bag. A committed mount or imperative owner must
 * retain it before use. Retaining also cancels a queued disposal during
 * StrictMode replay; it is not reference counting or a restart after disposal.
 */
export function createStores(
  authActor: ActorRefFrom<typeof authMachine> = createActor(authMachine),
) {
  const auth = new AuthStore(authActor)
  let lifecycle: 'unretained' | 'retained' | 'disposed' = 'unretained'
  let disposeGen = 0
  return {
    auth,
    retain() {
      if (lifecycle === 'disposed') return
      disposeGen += 1
      if (lifecycle === 'retained') return
      lifecycle = 'retained'
      auth.connect()
      authActor.start()
    },
    dispose() {
      const gen = disposeGen
      queueMicrotask(() => {
        if (gen !== disposeGen || lifecycle === 'disposed') return
        const wasRetained = lifecycle === 'retained'
        lifecycle = 'disposed'
        auth.disconnect()
        if (wasRetained && authActor.getSnapshot().status === 'active') authActor.stop()
      })
    },
  }
}
