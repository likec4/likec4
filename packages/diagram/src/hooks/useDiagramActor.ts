import { useCallbackRef } from '@mantine/hooks'
import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { useActorRef } from '../likec4diagram/state/actorContext'
import type { LikeC4ViewActorRef } from '../likec4diagram/state/machine'
import { type MachineSnapshot } from '../likec4diagram/state/machine'
import type { SyncLayoutActorSnapshot } from '../likec4diagram/state/syncManualLayoutActor'

export function useDiagramActor(): LikeC4ViewActorRef {
  return useActorRef()
}
export function useDiagramActorState<T = unknown>(
  selector: (state: MachineSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
): T {
  const actorRef = useActorRef()
  const select = useCallbackRef(selector)
  return useXstateSelector(actorRef, select, compare)
}

export function useDiagramSyncLayoutState<T = unknown>(
  selector: (state: SyncLayoutActorSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
): T {
  const syncLayoutActorRef = useDiagramActorState(s => s.context.syncLayoutActorRef, Object.is)
  const select = useCallbackRef(selector)
  return useXstateSelector(syncLayoutActorRef, select, compare)
}
