import { waitFor, type ActorRefFrom, type SnapshotFrom, type Subscription } from 'xstate'
import type { Me } from '../lib/types'
import type { authMachine, AuthEvent } from './authMachine'

/** Plain projection of the auth actor. Views observe this; they never send to XState directly. */
export class AuthStore {
  snapshot: SnapshotFrom<typeof authMachine>
  private actorSubscription: Subscription | undefined = undefined
  private readonly listeners = new Set<() => void>()

  constructor(private readonly actor: ActorRefFrom<typeof authMachine>) {
    this.snapshot = actor.getSnapshot()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot(): SnapshotFrom<typeof authMachine> {
    return this.snapshot
  }

  connect(): void {
    if (this.actorSubscription) return
    this.actorSubscription = this.actor.subscribe((next: SnapshotFrom<typeof authMachine>) => {
      this.snapshot = next
      this.notify()
    })
    this.snapshot = this.actor.getSnapshot()
    this.notify()
  }

  disconnect(): void {
    this.actorSubscription?.unsubscribe()
    this.actorSubscription = undefined
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

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}
