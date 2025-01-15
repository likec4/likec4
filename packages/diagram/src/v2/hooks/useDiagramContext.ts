import { useCallbackRef } from '@mantine/hooks'
import { shallowEqual } from 'fast-equals'
import { type State, LikeC4ViewMachineContext } from '../state/machine'

export function useDiagramContext<T>(selector: (state: State['context']) => T, compare = shallowEqual) {
  const select = useCallbackRef((s: State) => selector(s.context))
  return LikeC4ViewMachineContext.useSelector(select, compare)
}
