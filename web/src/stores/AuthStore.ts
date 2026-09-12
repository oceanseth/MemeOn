import { action, makeAutoObservable, observableRef, runInAction } from 'mobx'
import { waitFor, type ActorRefFrom, type SnapshotFrom, type Subscription } from 'xstate'
import type { Me } from '../lib/types'
import { authMachine, type AuthEvent } from './authMachine'

/** MobX projection of the auth actor. Views observe this; they never send to XState directly. */
export class AuthStore {
  snapshot: SnapshotFrom<typeof authMachine>
  private subscription: Subscription | undefined = undefined

  constructor(private readonly actor: ActorRefFrom<typeof authMachine>) {
    this.snapshot = actor.getSnapshot()
    makeAutoObservable<this, 'actor' | 'subscription'>(this, {
      actor: false,
      subscription: false,
      snapshot: observableRef,
      connect: false,
      disconnect: false,
      send: false,
      refresh: false,
      logout: false,
    }, { autoBind: true })
  }

  connect(): void {
    if (this.subscription) return
    this.subscription = this.actor.subscribe(action((next: SnapshotFrom<typeof authMachine>) => {
      this.snapshot = next
    }))
    runInAction(() => { this.snapshot = this.actor.getSnapshot() })
  }

  disconnect(): void {
    this.subscription?.unsubscribe()
    this.subscription = undefined
  }

  get user(): Me | null {
    return this.snapshot.context.user
  }

  get loading(): boolean {
    return this.user === null && (this.snapshot.matches('idle') || this.snapshot.matches('loading'))
  }

  get error(): string | null {
    return this.snapshot.context.error
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
