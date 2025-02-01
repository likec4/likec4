import { useCallbackRef } from '@mantine/hooks'
import { shallowEqual } from 'fast-equals'
import { useSelector } from '../likec4diagram/state/actorContext'
import { type DiagramContext, type MachineSnapshot } from '../likec4diagram/state/machine'

export function useDiagramContext<T = unknown>(
  selector: (state: DiagramContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
) {
  const select = useCallbackRef((s: MachineSnapshot) => selector(s.context))
  return useSelector(select, compare)
}

export { DiagramContext } from '../likec4diagram/state/machine'
