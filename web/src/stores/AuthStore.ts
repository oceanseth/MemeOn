import { makeAutoObservable } from 'mobx'
import { waitFor, type ActorRefFrom, type SnapshotFrom } from 'xstate'
import type { Me } from '../lib/types'
import { authMachine, type AuthEvent } from './authMachine'

/** MobX projection of the auth actor. Views observe this; they never send to XState directly. */
export class AuthStore {
  snapshot: SnapshotFrom<typeof authMachine>

  constructor(private readonly actor: ActorRefFrom<typeof authMachine>) {
    this.snapshot = actor.getSnapshot()
    makeAutoObservable(this, { send: false, refresh: false, logout: false }, { autoBind: true })
    actor.subscribe((next) => {
      this.snapshot = next
    })
  }

  get user(): Me | null {
    return this.snapshot.context.user
  }

  get loading(): boolean {
    return this.snapshot.matches('idle') || this.snapshot.matches('loading')
  }

  send(event: AuthEvent): void {
    this.actor.send(event)
  }

  async refresh(): Promise<void> {
    this.send({ type: 'START' })
    await waitFor(this.actor, (state) => state.hasTag('settled'))
  }

  logout(): void {
    this.send({ type: 'LOGOUT' })
  }
}
