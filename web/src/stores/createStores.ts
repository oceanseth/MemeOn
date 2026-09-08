import { createActor, type ActorRefFrom } from 'xstate'
import { AuthStore } from './AuthStore'
import { authMachine } from './authMachine'

export type AppStores = ReturnType<typeof createStores>

/**
 * App / story store bag. The auth actor is started here and lives with this
 * object. `dispose` is reversible so React StrictMode's fake unmount cannot
 * kill an actor that `useState` will reuse on remount.
 */
export function createStores(
  authActor: ActorRefFrom<typeof authMachine> = createActor(authMachine),
) {
  const auth = new AuthStore(authActor)
  authActor.start()
  let disposeGen = 0
  return {
    auth,
    retain() {
      disposeGen += 1
    },
    dispose() {
      const gen = disposeGen
      queueMicrotask(() => {
        if (gen !== disposeGen) return
        if (authActor.getSnapshot().status === 'active') authActor.stop()
      })
    },
  }
}
