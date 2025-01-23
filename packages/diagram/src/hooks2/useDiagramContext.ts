import { useCallbackRef } from '@mantine/hooks'
import { shallowEqual } from 'fast-equals'
import { useSelector } from '../likec4diagram/state/actorContext'
import { type DiagramContext, type MachineSnapshot } from '../likec4diagram/state/machine'

export function useDiagramContext<T>(selector: (state: DiagramContext) => T, compare = shallowEqual) {
  const select = useCallbackRef((s: MachineSnapshot) => selector(s.context))
  return useSelector(select, compare)
}
