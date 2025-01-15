import { useCallbackRef } from '@mantine/hooks'
import { shallowEqual } from 'fast-equals'
import { type State, LikeC4ViewMachineContext } from '../state/machine'

export function useDiagramState<T>(selector: (state: State) => T, compare = shallowEqual) {
  const select = useCallbackRef((s: State) => selector(s))
  return LikeC4ViewMachineContext.useSelector(select, compare)
}
