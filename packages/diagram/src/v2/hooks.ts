import { useCallbackRef } from '@mantine/hooks'
import { shallowEqual } from 'fast-equals'
import type { Actor } from 'xstate'
import { useActorRef, useSelector } from './DiagramActor'
import type { Logic, State } from './state/machine'

export const useDiagramActor: () => Actor<Logic> = useActorRef

export function useDiagramState<T>(selector: (state: State) => T, compare = shallowEqual) {
  const select = useCallbackRef((s: State) => selector(s))
  return useSelector(select, compare)
}

export function useDiagramContext<T>(selector: (state: State['context']) => T, compare = shallowEqual) {
  const select = useCallbackRef((s: State) => selector(s.context))
  return useSelector(select, compare)
}
