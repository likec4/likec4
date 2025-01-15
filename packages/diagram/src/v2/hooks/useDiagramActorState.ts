import { useCallbackRef } from '@mantine/hooks'
import { shallowEqual } from 'fast-equals'
import { type MachineSnapshot, LikeC4ViewMachineContext } from '../state/machine'

export function useDiagramActorState<T>(selector: (state: MachineSnapshot) => T, compare = shallowEqual) {
  const select = useCallbackRef((s: MachineSnapshot) => selector(s))
  return LikeC4ViewMachineContext.useSelector(select, compare)
}
