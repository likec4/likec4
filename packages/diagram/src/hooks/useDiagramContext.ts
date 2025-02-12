import { useCallbackRef } from '@mantine/hooks'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { useActorRef } from '../likec4diagram/state/actorContext'
import { type DiagramContext, type MachineSnapshot } from '../likec4diagram/state/machine'

export function useDiagramContext<T = unknown>(
  selector: (state: DiagramContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
) {
  const actorRef = useActorRef()
  const select = useCallbackRef((s: MachineSnapshot) => selector(s.context))
  return useSelector(actorRef, select, compare)
}
