import { useSelector as useXstateSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import { invariant } from 'motion'
import { type Provider, createContext, useContext } from 'react'
import { isFunction } from 'remeda'
import type { AnyActorRef, SnapshotFrom } from 'xstate'
import type { DiagramApi } from '../likec4diagram/state/diagram-api'
import type { DiagramMachineSnapshot } from '../likec4diagram/state/machine'
import type { DiagramActorRef, DiagramContext } from '../likec4diagram/state/types'

const DiagramApiSafeContext = createContext<DiagramApi>(null as any)
DiagramApiSafeContext.displayName = 'DiagramApiSafeContext'

export const DiagramApiContextProvider: Provider<DiagramApi> = DiagramApiSafeContext.Provider

export function useDiagram(): DiagramApi {
  const ctx = useContext(DiagramApiSafeContext)
  if (ctx === null) {
    throw new Error('DiagramApi is not provided')
  }
  return ctx
}

/**
 * Tuple type for selector and compare function pair
 */
type SelectAndCompare<A, B> = [
  selector: (snapshot: A) => B,
  compare: (a: B, b: B) => boolean,
]

type SafeContextForActor<A extends AnyActorRef, Snapshot, Context> = {
  /**
   * The React context provider for this actor
   */
  ContextProvider: Provider<A>

  /**
   * Hook to get the actor ref from context
   */
  useActorRef: () => A

  /**
   * @param select - Function to extract a value from the actor's snapshot
   * @param compare - Optional comparison function. If not provided, shallow equality is used.
   *                  The comparison function receives the selected value from the previous snapshot ()
   *                  and the selected value from the current snapshot. If the comparison returns true,
   *                  the component will not re-render.
   */
  selectSnapshot<T>(
    select: (state: Snapshot) => T,
    compare?: (old: NoInfer<T>, next: NoInfer<T>) => boolean,
  ): SelectAndCompare<Snapshot, T>

  /**
   * @param select - Function to extract a value from the actor's context
   * @param compare - Optional comparison function. If not provided, shallow equality is used.
   */
  selectContext<T>(
    select: (state: Context) => T,
    compare?: (old: NoInfer<T>, next: NoInfer<T>) => boolean,
  ): SelectAndCompare<Snapshot, T>

  useActorSelector<T>(select: (state: Snapshot) => T): T
  useActorSelector<T>(selectorCompare: SelectAndCompare<Snapshot, T>): T
  useActorSelector<T>(...selectorCompare: SelectAndCompare<Snapshot, T>): T
}

/**
 * Helper to create a safe context for an actor
 * @example
 * ```tsx
 * const {
 *   ContextProvider: MyActorContext,
 *   useActorRef,
 *   selectSnapshot,
 *   useActorSelector
 * } = createSafeContextForActor<MyActorRef>()
 *
 * const select = selectSnapshot(
 *   s => ....,
 *   (a, b) => a === b
 * )
 *
 * // Later in component:
 * const value = useActorSelector(select)
 * ```
 */
export function createSafeContextForActor<
  A extends AnyActorRef,
  Snapshot = SnapshotFrom<A>,
  Context = Snapshot extends { context: infer C } ? C : never,
>(
  name: string,
): SafeContextForActor<A, Snapshot, Context> {
  const Ctx = createContext<A>(null as any)

  // -----------------
  // snapshot selector overloads
  // -----------------
  function selectSnapshot<T>(
    selector: (state: Snapshot) => T,
    compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean,
  ): SelectAndCompare<Snapshot, T> {
    return [
      selector,
      compare ?? shallowEqual,
    ]
  }
  // -----------------
  // context selector overloads
  // -----------------
  function selectContext<T>(
    selector: (state: Context) => T,
    compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean,
  ): SelectAndCompare<Snapshot, T> {
    return [
      (snapshot: Snapshot) => selector((snapshot as any).context),
      compare ?? shallowEqual,
    ]
  }
  // -----------------
  // useActorRef hook
  // -----------------
  function useActorRef() {
    const actorRef = useContext(Ctx)
    if (actorRef === null) {
      throw new Error(`${name}SafeContext is not provided `)
    }
    return actorRef
  }
  // -----------------
  // useActorSelector overloads
  // -----------------
  function useActorSelector<T>(
    selectorCompare: SelectAndCompare<Snapshot, T>,
  ): T
  function useActorSelector<T>(
    selector: (snapshot: Snapshot) => T,
    compare?: (a: NoInfer<T>, b: NoInfer<T>) => boolean,
  ): T
  function useActorSelector(arg1: any | any[], arg2?: any) {
    let selector, compare
    if (arg2 !== undefined) {
      ;[selector, compare] = [arg1, arg2]
    } else if (Array.isArray(arg1)) {
      ;[selector, compare] = arg1
    } else {
      selector = arg1
      compare = shallowEqual
    }
    compare ??= shallowEqual
    invariant(isFunction(selector), 'selector must be a function')
    return useXstateSelector(
      useActorRef(),
      selector,
      compare,
    )
  }

  return {
    ContextProvider: Ctx.Provider,
    selectSnapshot,
    selectContext,
    useActorSelector,
    useActorRef,
  } as SafeContextForActor<A, Snapshot, Context>
}

export const {
  ContextProvider: DiagramActorContextProvider,
  selectSnapshot: selectDiagramSnapshot,
  selectContext: selectDiagramContext,
  useActorSelector: useDiagramSelector,
  useActorRef: useDiagramActorRef,
} = createSafeContextForActor<DiagramActorRef, DiagramMachineSnapshot, DiagramContext>('DiagramActor')
