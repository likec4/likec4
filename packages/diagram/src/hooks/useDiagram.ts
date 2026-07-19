import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, useCallback, useEffect, useRef } from 'react'
import type { Subscription } from 'xstate'
import type { DiagramApi } from '../likec4diagram/state/diagram-api'
import type {
  DiagramActorSnapshot,
  DiagramContext,
  DiagramEmittedEvents,
} from '../likec4diagram/state/types'
import { useDiagram, useDiagramActorRef } from './safeContext'
import { useCallbackRef } from './useCallbackRef'

export { useDiagram, useDiagramActorRef }

export type { DiagramApi, DiagramContext }

/**
 * Helper to create a selector for diagram actor snapshot
 * @deprecated use {@link selectDiagramSnapshot}
 */
export function selectDiagramActor<T = unknown>(
  selector: (state: DiagramActorSnapshot) => T,
): (state: DiagramActorSnapshot) => T {
  return selector
}

/**
 * Read diagram actor snapshot
 * @deprecated use {@link useDiagramSelector}
 */
export function useDiagramSnapshot<T = unknown>(
  selector: (state: DiagramActorSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
): T {
  const actorRef = useDiagramActorRef()
  return useXstateSelector(actorRef, selector, compare)
}

/**
 * Helper to create a selector for diagram actor snapshot
 * @deprecated use {@link selectDiagramContext}
 */
export function selectDiagramActorContext<T = unknown>(
  selector: (state: DiagramContext) => T,
): (state: DiagramActorSnapshot) => T {
  return (state: DiagramActorSnapshot) => selector(state.context)
}

/**
 * Read diagram context
 * @deprecated use {@link useDiagramSelector}
 */
export function useDiagramContext<T = unknown>(
  selector: (context: DiagramContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
  deps: DependencyList = [],
): T {
  const actorRef = useDiagramActorRef()
  const selectorRef = useCallbackRef(selector)
  // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  const select = useCallback((s: DiagramActorSnapshot) => selectorRef(s.context), deps)
  return useXstateSelector(actorRef, select, compare)
}

type PickEmittedEvent<T> = T extends DiagramEmittedEvents['type'] ? DiagramEmittedEvents & { type: T } : unknown

/**
 * Subscribe to diagram emitted events
 * @example
 * ```tsx
 * useOnDiagramEvent('navigateTo', ({viewId}) => {
 *   console.log('Navigating to view', viewId)
 * })
 * ```
 */
export function useOnDiagramEvent<T extends DiagramEmittedEvents['type'] | '*'>(
  event: T,
  callback: (event: PickEmittedEvent<T>) => void,
  options?: { once?: boolean },
): void {
  const actorRef = useDiagramActorRef()
  const callbackRef = useCallbackRef(callback)
  const wasCalled = useRef(false)
  const once = options?.once ?? false

  useEffect(() => {
    if (once && wasCalled.current) {
      return
    }
    let subscription: Subscription | null = actorRef.on<T>(event, (payload) => {
      if (!once || !wasCalled.current) {
        try {
          callbackRef(payload as PickEmittedEvent<T>)
        } catch (error) {
          console.error(error)
        }
      }
      wasCalled.current = true
      if (once) {
        subscription?.unsubscribe()
        subscription = null
      }
    })
    return () => {
      subscription?.unsubscribe()
    }
  }, [callbackRef, actorRef, event, once])
}

export {
  selectDiagramContext,
  selectDiagramSnapshot,
  useDiagramSelector,
} from './safeContext'
