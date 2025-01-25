import { useCallbackRef } from '@mantine/hooks'
import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { useSelector } from '../likec4diagram/state/actorContext'
import { type MachineSnapshot } from '../likec4diagram/state/machine'
import type { SyncLayoutActorSnapshot } from '../likec4diagram/state/syncManualLayoutActor'

export function useDiagramActorState<T>(selector: (state: MachineSnapshot) => T, compare = shallowEqual): T {
  const select = useCallbackRef((s: MachineSnapshot) => selector(s))
  return useSelector(select, compare)
}

export function useDiagramSyncLayoutState<T>(
  selector: (state: SyncLayoutActorSnapshot) => T,
  compare = shallowEqual,
): T {
  const syncLayoutActorRef = useDiagramActorState(s => s.context.syncLayoutActorRef)
  const select = useCallbackRef(selector)
  return useXstateSelector(syncLayoutActorRef, select, compare)
}
