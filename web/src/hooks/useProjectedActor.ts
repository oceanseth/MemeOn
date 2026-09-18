import { useActorRef } from '@xstate/react'
import { useState } from 'react'
import type { Actor, AnyActorLogic, SnapshotFrom } from 'xstate'
import { ActorSnapshotProjection } from '../stores/ActorSnapshotProjection'
import { useMountEffect } from './useMountEffect'

/**
 * Route-local actor lifetime belongs to XState; observer views read its MobX projection.
 * Keep logic stable for the mount and key the view when its route inputs change.
 */
export function useProjectedActor<TLogic extends AnyActorLogic>(
  ...args: Parameters<typeof useActorRef<TLogic>>
): [SnapshotFrom<TLogic>, Actor<TLogic>['send'], Actor<TLogic>] {
  const actor = useActorRef<TLogic>(...args)
  const [projection] = useState(() => new ActorSnapshotProjection(actor.getSnapshot()))

  useMountEffect(() => {
    const subscription = actor.subscribe(projection.update)
    // Actor startup and child layout effects can advance it before this subscription.
    projection.update(actor.getSnapshot())
    return () => subscription.unsubscribe()
  })

  return [projection.snapshot, actor.send, actor]
}
