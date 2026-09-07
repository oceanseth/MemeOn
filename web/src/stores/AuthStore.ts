import { makeAutoObservable } from 'mobx'
import type { ActorRefFrom, SnapshotFrom } from 'xstate'
import type { AuthEvent, authMachine } from './authMachine'

/** MobX projection of the auth actor. Views observe this; they never send to XState directly. */
export class AuthStore {
  snapshot: SnapshotFrom<typeof authMachine>

  constructor(private readonly actor: ActorRefFrom<typeof authMachine>) {
    this.snapshot = actor.getSnapshot()
    makeAutoObservable(this, { send: false }, { autoBind: true })
    actor.subscribe((next) => {
      this.snapshot = next
    })
  }

  send(event: AuthEvent): void {
    this.actor.send(event)
  }
}
