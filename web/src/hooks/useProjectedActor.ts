import { useActorRef, useSelector } from '@xstate/react'
import type { Actor, AnyActorLogic, SnapshotFrom } from 'xstate'

/**
 * Route-local actor lifetime belongs to XState; React reads the snapshot via useSelector.
 * Keep logic stable for the mount and key the view when its route inputs change.
 */
export function useProjectedActor<TLogic extends AnyActorLogic>(
  ...args: Parameters<typeof useActorRef<TLogic>>
): [SnapshotFrom<TLogic>, Actor<TLogic>['send'], Actor<TLogic>] {
  const actor = useActorRef<TLogic>(...args)
  const snapshot = useSelector(actor, (s) => s)
  return [snapshot, actor.send, actor]
}
