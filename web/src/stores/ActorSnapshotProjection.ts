import { actionBound, makeObservable, observableRef } from 'mobx'

/** Observe immutable actor snapshots without wrapping their context or actor references. */
export class ActorSnapshotProjection<TSnapshot> {
  snapshot: TSnapshot

  constructor(snapshot: TSnapshot) {
    this.snapshot = snapshot
    makeObservable(this, { snapshot: observableRef, update: actionBound })
  }

  update(snapshot: TSnapshot): void {
    this.snapshot = snapshot
  }
}
