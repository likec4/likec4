import { useCallbackRef } from '@mantine/hooks'
import { shallowEqual } from 'fast-equals'
import { type MachineSnapshot, LikeC4ViewMachineContext } from '../state/machine'

export function useDiagramContext<T>(selector: (state: MachineSnapshot['context']) => T, compare = shallowEqual) {
  const select = useCallbackRef((s: MachineSnapshot) => selector(s.context))
  return LikeC4ViewMachineContext.useSelector(select, compare)
}
