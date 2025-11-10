import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, useCallback, useEffect, useRef } from 'react'
import type { DiagramApi } from '../likec4diagram/state/diagram-api'
import type {
  DiagramActorSnapshot,
  DiagramContext,
  DiagramEmittedEvents,
} from '../likec4diagram/state/types'
import { useDiagram, useDiagramActorRef } from './safeContext'

export { useDiagram, useDiagramActorRef }

export type { DiagramApi, DiagramContext }

export function useDiagramActorSnapshot<T = unknown>(
  selector: (state: DiagramActorSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
): T {
  const actorRef = useDiagramActorRef()
  return useXstateSelector(actorRef, selector, compare)
}

/**
 * Read diagram context
 */
export function useDiagramContext<T = unknown>(
  selector: (context: DiagramContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
  deps?: DependencyList,
): T {
  const actorRef = useDiagramActorRef()
  const select = useCallback((s: DiagramActorSnapshot) => selector(s.context), deps ?? [])
  return useXstateSelector(actorRef, select, compare)
}

type PickEmittedEvent<T> = T extends DiagramEmittedEvents['type'] ? DiagramEmittedEvents & { type: T } : never

/**
 * Subscribe to diagram emitted events
 * @example
 * ```tsx
 * useOnDiagramEvent('navigateTo', ({viewId}) => {
 *   console.log('Navigating to view', viewId)
 * })
 * ```
 */
export function useOnDiagramEvent<T extends DiagramEmittedEvents['type']>(
  event: T,
  callback: (event: PickEmittedEvent<T>) => void,
): void {
  const actorRef = useDiagramActorRef()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const subscription = actorRef.on(event, (payload) => {
      callbackRef.current(payload as PickEmittedEvent<T>)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [actorRef, event])
}
