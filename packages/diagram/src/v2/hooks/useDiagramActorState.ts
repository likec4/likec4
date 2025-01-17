import { useCallbackRef } from '@mantine/hooks'
import { shallowEqual } from 'fast-equals'
import { useSelector } from '../state/actorContext'
import { type MachineSnapshot } from '../state/machine'

export function useDiagramActorState<T>(selector: (state: MachineSnapshot) => T, compare = shallowEqual): T {
  const select = useCallbackRef((s: MachineSnapshot) => selector(s))
  return useSelector(select, compare)
}
