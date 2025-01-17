import { useCallbackRef } from '@mantine/hooks'
import { shallowEqual } from 'fast-equals'
import { useSelector } from '../state/actorContext'
import { type Context, type MachineSnapshot } from '../state/machine'

export function useDiagramContext<T>(selector: (state: Context) => T, compare = shallowEqual) {
  const select = useCallbackRef((s: MachineSnapshot) => selector(s.context))
  return useSelector(select, compare)
}
