import type { EdgeId, Fqn, NodeId } from '@likec4/core'
import { useCallbackRef } from '@mantine/hooks'
import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { useMemo, useTransition } from 'react'
import type { AnyActorRef, SnapshotFrom } from 'xstate'
import type { MachineSnapshot } from '../likec4diagram/state/machine'
import type { OverlaysActorRef, OverlaysContext } from '../overlays/overlaysActor'
import { useDiagramActor, useDiagramActorState } from './useDiagramActor'

// export function useDiagramActor(): LikeC4ViewActorRef {
//   return useActorRef()
// }
// export function useDiagramActorState<T = unknown>(
//   selector: (state: MachineSnapshot) => T,
//   compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
// ): T {
//   const select = useCallbackRef((s: MachineSnapshot) => selector(s))
//   return useSelector(select, compare)
// }

// export function useDiagramSyncLayoutState<T = unknown>(
//   selector: (state: SyncLayoutActorSnapshot) => T,
//   compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
// ): T {
//   const syncLayoutActorRef = useDiagramActorState(s => s.context.syncLayoutActorRef)
//   const select = useCallbackRef(selector)
//   return useXstateSelector(syncLayoutActorRef, select, compare)
// }

const selectOverlaysActor = (s: MachineSnapshot) => s.context.overlaysActorRef as OverlaysActorRef
export function useOverlaysActor() {
  return useDiagramActorState(selectOverlaysActor, Object.is)
}

export function useOverlaysContext<T = unknown>(
  selector: (state: OverlaysContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
): T {
  const overlaysActorRef = useOverlaysActor()
  const select = useCallbackRef((s: SnapshotFrom<OverlaysActorRef>) => selector(s.context))
  return useXstateSelector(overlaysActorRef, select, compare)
}

export function useOverlays() {
  const diagram = useDiagramActor()
  const actor = useOverlaysActor()
  const [, startTransition] = useTransition()
  return useMemo(() => ({
    openRelationshipsBrowser: (subject: Fqn) => {
      startTransition(() => {
        const scope = diagram.getSnapshot().context.view
        actor.send({ type: 'open.relationshipsBrowser', subject, scope })
      })
    },
    openElementDetails: (fqn: Fqn, fromNode?: NodeId) => {
      startTransition(() => {
        // Diagram Actor sends message to Overlays Actor
        diagram.send({ type: 'open.elementDetails', fqn, fromNode })
      })
    },
    openRelationshipDetails: (edgeId: EdgeId) => {
      startTransition(() => {
        const currentView = diagram.getSnapshot().context.view
        actor.send({ type: 'open.relationshipDetails', edgeId, currentView })
      })
    },
    close: (overlayActor?: AnyActorRef) => actor.send({ type: 'close', overlayActor }),
    closeAll: () => actor.send({ type: 'close.all' }),
  }), [actor])
}
