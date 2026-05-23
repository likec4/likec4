import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { type DependencyList, useCallback, useEffect, useRef } from 'react'
import { hasAtLeast } from 'remeda'
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
 */
export function selectDiagramActor<T = unknown>(
  selector: (state: DiagramActorSnapshot) => T,
): (state: DiagramActorSnapshot) => T {
  return selector
}

export function useDiagramSnapshot<T = unknown>(
  selector: (state: DiagramActorSnapshot) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
): T {
  const actorRef = useDiagramActorRef()
  return useXstateSelector(actorRef, selector, compare)
}

/**
 * Helper to create a selector for diagram actor snapshot
 */
export function selectDiagramActorContext<T = unknown>(
  selector: (state: DiagramContext) => T,
): (state: DiagramActorSnapshot) => T {
  return (state: DiagramActorSnapshot) => selector(state.context)
}

/**
 * Read diagram context
 * @deprecated Use {@link useDiagramState} instead
 */
export function useDiagramContext<T = unknown>(
  selector: (context: DiagramContext) => T,
  compare: (a: NoInfer<T>, b: NoInfer<T>) => boolean = shallowEqual,
  deps: DependencyList = [],
): T {
  const actorRef = useDiagramActorRef()
  return useXstateSelector(
    actorRef,
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
    useCallback((s: DiagramActorSnapshot) => selector(s.context), deps),
    compare,
  )
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

/**
 * Select from diagram context with default shallow equality comparator
 * @example
 * ```tsx
 * const selectDiagram = selectDiagramContext(ctx => ctx.diagram)
 * //...
 * const diagram = useDiagramState(selectDiagram)
 * ```
 */
export function selectDiagramContext<T>(
  selector: (state: DiagramContext) => T,
): [
  selector: (snapshot: DiagramActorSnapshot) => T,
  compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
]
/**
 * Select from diagram context with custom comparator
 */
export function selectDiagramContext<T>(
  selector: (state: DiagramContext) => T,
  compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
): [
  selector: (snapshot: DiagramActorSnapshot) => T,
  compare: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
]
export function selectDiagramContext<T>(
  selector: (state: DiagramContext) => T,
  compare?: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
) {
  return [
    (snapshot: DiagramActorSnapshot) => selector(snapshot.context),
    compare ?? shallowEqual,
  ] as const
}
/**
 * Read from diagram state
 *
 * @example
 * ```tsx
 * const selectDiagram = selectDiagramContext(ctx => ctx.diagram)
 * //...
 * const diagram = useDiagramState(selectDiagram)
 * ```
 */
export function useDiagramState<T>(
  arg1: readonly [
    (snapshot: DiagramActorSnapshot) => T,
    (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
  ],
): T
export function useDiagramState<T>(
  selector: (snapshot: DiagramActorSnapshot) => T,
  compare?: (a: NoInfer<T> | undefined, b: NoInfer<T>) => boolean,
): T
export function useDiagramState(...args: unknown[]) {
  let selector, compare
  if (args.length === 2) {
    ;[selector, compare] = args
  } else if (args.length === 1 && Array.isArray(args[0]) && hasAtLeast(args[0], 2)) {
    ;[selector, compare] = args[0] as any
  } else if (args.length === 1 && Array.isArray(args[0]) && hasAtLeast(args[0], 1)) {
    ;[selector, compare] = [args[0] as any, shallowEqual]
  } else if (args.length === 1 && typeof args[0] === 'function') {
    ;[selector, compare] = [args[0] as any, shallowEqual]
  } else {
    throw new Error('Invalid arguments for useDiagramState')
  }
  const actorRef = useDiagramActorRef()
  return useXstateSelector(
    actorRef,
    selector,
    compare,
  )
}
