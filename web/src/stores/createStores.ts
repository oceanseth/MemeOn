import { createActor } from 'xstate'
import { AuthStore } from './AuthStore'
import { authMachine } from './authMachine'

export type AppStores = ReturnType<typeof createStores>

export function createStores() {
  const authActor = createActor(authMachine)
  const auth = new AuthStore(authActor)
  authActor.start()
  return {
    auth,
    dispose() {
      authActor.stop()
    },
  }
}
