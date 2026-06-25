import { filter, find, first, firstBy, isBoolean, isFunction, isTruthy, map, pipe, purry } from 'remeda'
import type { IsEqual, Simplify } from 'type-fest'
import {
  compareNatural,
  compareNaturalHierarchically,
  DefaultWeakMap,
  invariant,
  isString,
  nonNullable,
} from '../utils'
import type { IsAnyOrNever, IterableContainer } from './_common'
import * as scalar from './scalar'
import type { ProcessedDynamicView } from './view'
import type { LayoutedDynamicView } from './view-layouted'
import type { AnyStep } from './view-parsed.dynamic'

type WithFlowBase<Dict extends {}> = {
  [T in keyof Dict]: Simplify<
    {
      readonly '_type': T
      /**
       * Prefix for step IDs in this flow (undefined for top-level flow)
       */
      readonly id: scalar.StepPath
      /**
       * Actors that are activated in this flow
       */
      readonly actors: readonly scalar.NodeId[]

      readonly title?: string | undefined
    } & Dict[T]
  >
}

/**
 * All possible sub-flow types
 */
type SubFlows = WithFlowBase<
  & {
    // Top-level flows
    [T in 'loop' | 'opt' | 'par']: {
      readonly flow: DynamicViewFlowSteps
    }
  }
  & {
    // Branch flows (for nested statements like try-catch, try-finally, etc.)
    [B in `try-${'block' | 'catch' | 'finally'}` | `alt-${'when' | 'else' | 'if'}`]: {
      readonly flow: DynamicViewFlowSteps
    }
  }
  & {
    'try': {
      /**
       * Allowed sub-flows for try statement
       */
      readonly flow:
        | readonly [Subflow<'try-block'>]
        | readonly [Subflow<'try-block'>, Subflow<'try-catch' | 'try-finally'>]
        | readonly [Subflow<'try-block'>, Subflow<'try-catch'>, Subflow<'try-finally'>]
    }
    'alt': {
      /**
       * Allowed sub-flows for alt statement
       */
      readonly flow: readonly Subflow<'alt-when' | 'alt-else' | 'alt-if'>[]
    }
  }
>

type SubflowType = keyof SubFlows
type Subflow<T extends SubflowType> = SubFlows[T]

type AnySubflow = SubFlows[SubflowType]

type NestedFlowOf<T extends SubflowType> = SubFlows[T] extends { flow: IterableContainer<infer F> } ? F : never

type ParentOf<T extends SubflowType> =
  // dprint-ignore
  IsAnyOrNever<T> extends true
    ? never
    : IsEqual<SubflowType,T> extends true
      ? SubflowType
      : T extends `try-${string}`
        ? 'try'
        : T extends `alt-${string}`
          ? 'alt'
          : Exclude<SubflowType, 'alt' | 'try'>

/**
 * Sub-flow types that can be used in dynamic view flows (excluding nested blocks like try-block, alt-when, etc.)
 * alt, try, loop, opt, par
 */
export type DynamicViewSubFlow = Subflow<'alt' | 'try' | 'loop' | 'opt' | 'par'>

/**
 * Steps in a dynamic view flow
 * Either a string (step path / id) or a sub-flow
 */
export type DynamicViewFlowSteps = ReadonlyArray<
  | scalar.StepPath
  | DynamicViewSubFlow
>

/**
 * Represents the complete flow structure for dynamic views, as a sequence of steps.
 * Can include nested flows, branches, loops, and conditional statements.
 */
export interface DynamicViewFlow {
  /**
   * Actors that are active in this flow
   * (excluding actors that are active in nested flows)
   */
  readonly actors: readonly scalar.NodeId[]

  /**
   * Steps in the flow
   */
  readonly steps: DynamicViewFlowSteps
}

function isSubFlow<T extends AnyStep>(step: T): step is Extract<T, AnySubflow>
function isSubFlow(step: unknown): step is AnySubflow
function isSubFlow(step: any) {
  return typeof step === 'object' && step != null
    && isString(step['id'])
    && isString(step['_type'])
    && Array.isArray(step['flow'])
}

export const flowGuards = {
  isStepPath: (step: unknown): step is scalar.StepPath => {
    return typeof step === 'string'
  },
  isSubFlow,
  isTry: (step: unknown): step is DynamicViewFlow.SubFlow.Try => {
    return isSubFlow(step) && step._type === 'try'
  },
  isAlt: (step: unknown): step is DynamicViewFlow.SubFlow.Alt => {
    return isSubFlow(step) && step._type === 'alt'
  },

  isAltBranch: (step: unknown): step is DynamicViewFlow.SubFlow.AltBranch => {
    return isSubFlow(step) && flowGuards.type.isTryBranch(step._type)
  },

  isTryBranch: (step: unknown): step is DynamicViewFlow.SubFlow.Try.Any => {
    return isSubFlow(step) && flowGuards.type.isTryBranch(step._type)
  },

  isStepOr:
    <S extends AnySubflow = AnySubflow>(predicate: (step: AnySubflow) => step is S) =>
    (step: unknown): step is scalar.StepPath | S => {
      return flowGuards.isStepPath(step) || (isSubFlow(step) && predicate(step))
    },

  type: {
    isAltBranch: (value: string): value is DynamicViewFlow.SubFlow.AltBranch['_type'] => {
      return value.startsWith('alt-')
    },
    isTryBranch: (value: string): value is DynamicViewFlow.SubFlow.Try.Any['_type'] => {
      return value.startsWith('try-')
    },
  },
}
function _isInside(flow: { id: scalar.StepPath }, step: scalar.StepPath | { id: scalar.StepPath }): boolean {
  const stepId = flowGuards.isStepPath(step) ? step : step.id
  return stepId.startsWith(flow.id)
}

type StepPathOrFlow = scalar.StepPath | { readonly id: scalar.StepPath }

/**
 * Returns a function that checks if a step is inside a flow, or checks if a step is inside a flow directly
 */
function isInside(step: StepPathOrFlow): (flow: { readonly id: scalar.StepPath }) => boolean
/**
 * Checks if a step is inside a flow
 */
function isInside<S extends StepPathOrFlow, F extends { readonly id: scalar.StepPath }>(
  flow: F,
  step: S,
): boolean
function isInside(...args: unknown[]) {
  return purry(_isInside, args)
}

function _isBefore(
  step: StepPathOrFlow,
  other: StepPathOrFlow,
): boolean {
  const stepId = flowGuards.isStepPath(step) ? step : step.id
  const otherId = flowGuards.isStepPath(other) ? other : other.id
  return compareNaturalHierarchically()(stepId, otherId) <= 0
}

/**
 * Returns a function that checks if a step is before other step,
 */
function isBefore(other: StepPathOrFlow): (step: StepPathOrFlow) => boolean
/**
 * Checks if a step is before another step
 */
function isBefore(step: StepPathOrFlow, other: StepPathOrFlow): boolean
function isBefore(...args: unknown[]) {
  return purry(_isBefore, args)
}

export const flowHelpers = {
  unwindTry: (step: { flow: DynamicViewFlow.SubFlow.Try['flow'] }): {
    tryBlock: DynamicViewFlow.SubFlow.Try.Block
    catchBlock: DynamicViewFlow.SubFlow.Try.Catch | null
    finallyBlock: DynamicViewFlow.SubFlow.Try.Finally | null
  } => {
    let [tryBlock, catchOrFinally = null, finallyBlock = null] = step.flow
    if (!finallyBlock && catchOrFinally?._type === 'try-finally') {
      finallyBlock = catchOrFinally
      catchOrFinally = null
    }
    return {
      tryBlock,
      catchBlock: catchOrFinally?._type === 'try-catch' ? catchOrFinally : null,
      finallyBlock,
    }
  },

  /**
   * Returns first step in subflow
   */
  firstStep: <F extends AnySubflow>(subflow: F): scalar.StepPath | null => {
    for (const s of subflow.flow) {
      const step = flowGuards.isStepPath(s) ? s : (
        flowGuards.isSubFlow(s) ? flowHelpers.firstStep(s) : null
      )

      if (step) {
        return step
      }
    }
    return null
  },

  hasSteps: <F extends AnySubflow>(subflow: F): boolean => {
    return !!flowHelpers.firstStep(subflow)
  },

  /**
   * Returns only step paths from a subflow (excluding nested subflows)
   */
  stepsOnly: (subflow: { flow: IterableContainer<scalar.StepPath> }): scalar.StepPath[] => {
    return filter(subflow.flow, flowGuards.isStepPath)
  },

  /**
   * Returns nested subflows (excluding steps)
   */
  nested: <N extends { _type: string }>(subflow: { flow: IterableContainer<scalar.StepPath | N> }): N[] => {
    return filter(subflow.flow, flowGuards.isSubFlow) as N[]
  },

  /**
   * Checks if step is before other step
   */
  isBefore,
  isInside,
}

export namespace DynamicViewFlow {
  export type SubFlowType = SubflowType
  export type SubFlow = DynamicViewSubFlow
  export type Steps = DynamicViewFlowSteps

  export type AnySubFlow = AnySubflow
  export type AnyStep = scalar.StepPath | AnySubflow

  export namespace SubFlow {
    export type Any = Subflow<SubflowType>

    /**
     * Generic subflow type for a given subflow type
     */
    export type Of<T extends SubflowType> = Subflow<T>

    export type Alt = Subflow<'alt'>
    export type AltBranch = Subflow<'alt-when' | 'alt-else' | 'alt-if'>
    export type Try = Subflow<'try'>

    export namespace Try {
      export type Block = Subflow<'try-block'>
      export type Catch = Subflow<'try-catch'>
      export type Finally = Subflow<'try-finally'>
      export type Any = Block | Catch | Finally
    }

    export type Loop = Subflow<'loop'>
    export type Opt = Subflow<'opt'>
    export type Par = Subflow<'par'>
  }
}

/**
 * Returns the ids of all ancestor subflows that enclose the given step path,
 * ordered from the outermost flow to the innermost (closest) one.
 *
 * A {@link scalar.StepPath} is a `.`-joined chain of segments where every
 * subflow segment carries a `NN:type` suffix (e.g. `02:opt`, `03:try`,
 * `01:block`), while a plain step segment is just its number (`NN`). Every
 * prefix that ends in such a `:`-bearing segment is therefore an ancestor flow.
 *
 * The path itself is never included — a flow is not its own ancestor — so
 * passing a flow id returns only the flows above it.
 *
 * @example
 * flowAncestors('step-01.02:opt.03:try.04' as StepPath)
 * // => ['step-01.02:opt', 'step-01.02:opt.03:try']
 */
export function flowAncestors(path: scalar.EdgeId | scalar.StepPath): scalar.StepPath[] {
  if (!path.includes(':')) {
    return []
  }
  const segments = path.split('.')
  const ancestors: scalar.StepPath[] = []
  let prefix: string | undefined
  // Skip the last segment: it is the path itself, not an ancestor.
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments.at(i)!
    prefix = prefix ? prefix + '.' + segment : segment
    if (segment.includes(':')) {
      ancestors.push(prefix as scalar.StepPath)
    }
  }
  return ancestors
}

/**
 * Returns the id of the immediate parent flow that directly encloses the given
 * step path, or `null` when the path lives at the top level.
 *
 * The parent is the innermost of {@link flowAncestors} — the longest prefix that
 * ends in a `:`-bearing subflow segment, excluding the path itself.
 *
 * @example
 * parentFlow('step-02:opt.03:try.04' as StepPath) // => 'step-02:opt.03:try'
 * parentFlow('step-02:opt.03:try' as StepPath)    // => 'step-02:opt'
 * parentFlow('step-04' as StepPath)               // => null
 */
export function parentFlow(path: scalar.EdgeId | scalar.StepPath | undefined | null): scalar.StepPath | null {
  if (!path) {
    return null
  }
  const lastDot = path.lastIndexOf('.')
  if (lastDot === -1) {
    return null
  }
  const parentPath = path.slice(0, lastDot) as scalar.StepPath
  return parentPath.includes(':') ? parentPath : null
}

type StepCtx<V extends ProcessedDynamicView<any>, R = DynamicViewFlow.AnyStep> = {
  readonly step: scalar.StepPath
  readonly edge: V['edges'][number]
  readonly source: V['nodes'][number]
  readonly target: V['nodes'][number]
  readonly stepnum: {
    /** Step number within the current flow */
    readonly index: number
    /** Global step number across all flows */
    readonly global: number
  }
  readonly level: number
  readonly parent: SubflowHookCtx | null

  readonly stopAndReturn: (step?: R | undefined) => never
}

type SubflowHookCtx<T extends SubflowType = SubflowType, R = DynamicViewFlow.AnyStep> = {
  readonly id: scalar.StepPath
  readonly type: T
  readonly subflow: Subflow<T>
  readonly previous: SubFlows[ParentOf<T>]['flow'][number] | null
  readonly parent: SubflowHookCtx<ParentOf<T>> | null
  readonly level: number

  readonly stopAndReturn: (step?: R | undefined) => never
}

type OnLeave<T extends SubflowType = SubflowType> = (onleave: {
  visited: Array<NestedFlowOf<T>>
}) => void

type SubflowHookResult<T extends SubflowType = SubflowType> = {
  /**
   * Next subflow(s) to visit, or undefined to continue with the default behavior
   *
   * @example
   * { next: 'step-02:opt.03:try' } // Single subflow
   * { next: ['step-02:opt.03:try', 'step-02:opt.04:catch'] } // Multiple subflows
   * { next: undefined } // Continue with default behavior
   */
  next?: undefined | NestedFlowOf<T> | ArrayLike<NestedFlowOf<T> | undefined>
  /**
   * Callback function that is called when leaving the subflow
   */
  onLeave?: OnLeave<T>
}

interface SubflowHook<T extends SubflowType = SubflowType, R = DynamicViewFlow.AnyStep> {
  /**
   * Callback function that is called on entry to each subflow.
   *
   * @param ctx - The context of the subflow
   * @returns {true} - Continue walking
   * @returns {void} - Continue walking
   * @returns {false} - Stop walking
   * @returns {OnLeave} - Continue walking with onLeave callback
   * @returns {SubflowHookResult<T>} - Continue walking with custom configuration
   */
  (ctx: SubflowHookCtx<T, R>): boolean | void | OnLeave<T> | SubflowHookResult<T>
}

type SubflowHookPerType<R> = Partial<
  Simplify<
    & {
      [K in SubflowType]: SubflowHook<K, R> | boolean
    }
    & {
      default: SubflowHook<SubflowType, R>
    }
  >
>

type WalkCallback<V extends ProcessedDynamicView<any>, R = DynamicViewFlow.AnyStep> = {
  step?: (ctx: StepCtx<V, R>) => void
  subflow?: SubflowHook<SubflowType, R> | SubflowHookPerType<R>
}

/**
 * Walks through the dynamic view flow and calls the callback for each step and subflow.
 * (Tree walker)
 *
 * @param view - The dynamic view to walk through
 * @param callback - The callback to call for each step and subflow
 *
 * @example
 * ```ts
 * walkthroughFlow(view, {
 *   step: ({step, stepnum}) => {
 *     console.log(`Step ${stepnum.global}: ${step}`)
 *   },
 *   subflow: ({subflow}) => {
 *     console.log(`Subflow ${subflow._type}: ${subflow.id}`)
 *     return {
 *       next: subflow.flow,
 *       onLeave: () => {
 *        console.log(`Left subflow ${subflow._type}`)
 *       }
 *     }
 *   }
 * })
 * ```
 */
class StopError {
  constructor(public readonly result: AnySubflow | scalar.StepPath) {}
}

export function walkthroughFlow<R extends DynamicViewFlow.AnyStep = DynamicViewFlow.AnyStep>(
  callback: WalkCallback<ProcessedDynamicView<any>, R>,
): (view: ProcessedDynamicView<any>) => R | undefined
export function walkthroughFlow<
  V extends ProcessedDynamicView<any> = ProcessedDynamicView<any>,
  R extends DynamicViewFlow.AnyStep = DynamicViewFlow.AnyStep,
>(
  view: V,
  callback: WalkCallback<V, R>,
): R | undefined
export function walkthroughFlow(
  ...args: [WalkCallback<any>] | [
    ProcessedDynamicView<any>,
    WalkCallback<any>,
  ]
) {
  if (args.length === 1) {
    return (view: ProcessedDynamicView<any>) => walkthroughFlow(view, args[0])
  }
  const [view, callback] = args
  if (!view.flow) {
    throw new Error(`Dynamic view ${view.id} does not have a flow`)
  }
  let stepnum = 1

  const edgesmap = new Map(view.edges.map((edge) => [edge.id, edge]))
  const nodesmap = new Map(view.nodes.map((node) => [node.id, node]))

  const visitStep = (
    step: scalar.StepPath,
    parent: SubflowHookCtx<any> | null,
    level: number,
    index: number,
  ) => {
    const edge = nonNullable(edgesmap.get(step))
    const source = nonNullable(nodesmap.get(edge.source))
    const target = nonNullable(nodesmap.get(edge.target))
    callback.step?.({
      step,
      level,
      edge,
      source,
      target,
      stepnum: {
        index,
        global: stepnum++,
      },
      parent,
      stopAndReturn: (arg) => {
        throw new StopError(arg ?? step)
      },
    })
  }

  const callSubflow = <T extends SubflowType>(
    ctx: SubflowHookCtx<T>,
  ): ReturnType<SubflowHook<T>> => {
    if (!callback.subflow) {
      return undefined
    }
    if (isFunction(callback.subflow)) {
      return callback.subflow(ctx)
    }
    const cb = callback.subflow[ctx.type] ?? callback.subflow.default
    if (isBoolean(cb)) {
      return cb
    }
    return isFunction(cb) ? cb(ctx) : undefined
  }

  const visitSubflow = (
    subflow: AnySubflow,
    parent: SubflowHookCtx<SubflowType> | null,
    previous: DynamicViewFlow.AnyStep | null,
    level = 0,
  ): boolean => {
    const ctx: SubflowHookCtx<SubflowType> = {
      id: subflow.id,
      type: subflow._type,
      subflow,
      parent,
      previous,
      level,
      stopAndReturn: (arg) => {
        throw new StopError(arg ?? subflow)
      },
    }
    const result = callSubflow(ctx) ?? true
    if (result === false) {
      return false
    }
    let next: AnySubflow['flow'], onLeave: SubflowHookResult<SubflowType>['onLeave']
    if (result === true) {
      next = subflow.flow
    } else if (isFunction(result)) {
      onLeave = result
      next = subflow.flow
    } else {
      next = result.next
        ? pipe(
          Array.isArray(result.next) ? result.next : [result.next],
          filter(isTruthy),
          map(v => {
            invariant(subflow.flow.includes(v as any), 'Next step must be part of the subflow')
            return v
          }),
        )
        : subflow.flow
      onLeave = result.onLeave
    }

    const visited = walk(next, ctx, level + 1)
    onLeave?.({ visited })
    return true
  }

  function walk(
    steps: AnySubflow['flow'],
    parent: SubflowHookCtx | null,
    level = 0,
  ): Array<NestedFlowOf<SubflowType>> {
    let index = 1
    let previous: DynamicViewFlow.AnyStep | null = null
    const visited = [] as DynamicViewFlow.AnyStep[]
    for (const step of steps) {
      if (flowGuards.isStepPath(step)) {
        visited.push(previous = step)
        visitStep(step, parent, level, index++)
        continue
      }
      if (visitSubflow(step, parent, previous, level)) {
        visited.push(step)
        previous = step
      }
    }
    return visited as unknown as Array<NestedFlowOf<SubflowType>>
  }

  try {
    walk(view.flow.steps, null, 0)
  } catch (e) {
    if (e instanceof StopError) {
      return e.result
    }
    throw e
  }
  return undefined
}

/**
 * Creates a map of  hooks for the given subflow types.
 * Each hook will be called when the corresponding subflow is entered.
 * @example
 * ```ts
 * walkthrough({
 *   view,
 *   subflow: {
 *     ...walkthrough.onSubflows(['try', 'alt'], ({subflow}) => {
 *       //  ...
 *       // subflow is typed
 *     }),
 *   },
 * })
 * ```
 */
function onSubflows<const T extends SubflowType & string, R = DynamicViewFlow.AnyStep>(
  types: T,
  callback: SubflowHook<NoInfer<T>, NoInfer<R>>,
): { [K in T]: SubflowHook<K, R> }
function onSubflows<const T extends readonly [SubflowType, ...SubflowType[]], R = DynamicViewFlow.AnyStep>(
  types: T,
  callback: SubflowHook<NoInfer<T>[number], NoInfer<R>>,
): { [K in T[number]]: SubflowHook<K, R> }
function onSubflows(
  types: SubflowType | SubflowType[],
  callback: SubflowHook<SubflowType>,
) {
  types = Array.isArray(types) ? types : [types]
  return Object.fromEntries(map(types, t => [t, callback]))
}
walkthroughFlow.onSubflows = onSubflows

/**
 * Creates a DynamicViewFlowOps instance from a dynamic view.
 * This is a convenience function that wraps DynamicViewFlowOps.from().
 */
export function dynamicViewFlow<V extends ProcessedDynamicView<any>>(view: V): DynamicViewFlowOps<V> {
  return DynamicViewFlowOps.from(view)
}

export class DynamicViewFlowOps<V extends ProcessedDynamicView<any> = LayoutedDynamicView> {
  private static cache = new DefaultWeakMap((view: ProcessedDynamicView<any>) => new DynamicViewFlowOps(view))

  public static from<V extends ProcessedDynamicView<any>>(view: V): DynamicViewFlowOps<V> {
    return this.cache.get(view) as DynamicViewFlowOps<V>
  }

  public readonly unwindTry = flowHelpers.unwindTry
  public readonly isBefore = flowHelpers.isBefore
  public readonly isInside = flowHelpers.isInside
  public readonly onSubflows = onSubflows
  public readonly guards = flowGuards

  protected readonly flow: DynamicViewFlow
  private levelById = new Map<scalar.StepPath, number>()
  private byId = new Map<scalar.StepPath, DynamicViewFlow.SubFlow.Any>()

  // private subflows = new DefaultWeakMap<scalar.StepPath, GenericSubFlow>(id => this.createSubFlowOps(id))

  private constructor(
    public readonly view: V,
  ) {
    if (!view.flow) {
      throw new Error(`Dynamic view "${view.id}" does not have a flow, probably it is a stale snapshot`)
    }
    this.flow = view.flow
    walkthroughFlow(view, {
      step: ({ step, level }) => {
        this.levelById.set(step, level)
      },
      subflow: ({ subflow, level }) => {
        this.byId.set(subflow.id, subflow)
        this.levelById.set(subflow.id, level)
      },
    })
  }

  /**
   * Returns all known step paths in the flow
   */
  get paths(): readonly scalar.StepPath[] {
    return Array.from(this.levelById.keys())
  }

  /**
   * Returns level in hierarchy (for z-indexes)
   */
  level(id: scalar.StepPath): number {
    return nonNullable(this.levelById.get(id))
  }

  /**
   * Returns the parent subflow of the given step path, or undefined if the step is not nested.
   * @param id The step path to find the parent for.
   * @returns The parent subflow, or undefined if the step is not nested.
   */
  parent(id: scalar.StepPath | scalar.EdgeId): DynamicViewFlow.SubFlow.Any | undefined {
    const parent = parentFlow(id)
    return parent ? this.lookup(parent) : undefined
  }

  /**
   * Lookup a subflow by its path.
   * @param id The path of the subflow to lookup.
   * @param assertType Optional type to assert the subflow type. If provided, throws if the subflow is not of the given type.
   * @returns The subflow with the given path, or throws if not found.
   */
  lookup<T extends SubflowType = SubflowType>(id: scalar.StepPath, assertType?: T): DynamicViewFlow.SubFlow.Of<T> {
    const subflow = nonNullable(this.byId.get(id), `SubFlow "${id}" not found`)
    if (assertType && subflow._type !== assertType) {
      throw new Error(`SubFlow "${id}" is of type "${subflow._type}" (expected "${assertType}")`)
    }
    return subflow as DynamicViewFlow.SubFlow.Of<T>
  }

  /**
   * Returns nested subflows of a given subflow.
   * @param id The path of the subflow to lookup.
   * @returns The subflow with the given path, or throws if not found.
   */
  nested<N extends AnySubflow>(subflow: { flow: IterableContainer<scalar.StepPath | N> }): N[]
  nested(id: scalar.StepPath): DynamicViewFlow.SubFlow.Any[]
  nested(value: scalar.StepPath | { flow: any }) {
    const subflow = typeof value === 'string' ? this.lookup(value) : value
    return subflow.flow.filter(flowGuards.isSubFlow)
  }

  /**
   * Checks if has nested subflows
   */
  hasSubflows(check: AnySubflow | scalar.StepPath): boolean {
    const subflow = typeof check === 'string' ? this.byId.get(check) : check
    return subflow?.flow.some(flowGuards.isSubFlow) ?? false
  }

  /**
   * @see Sequence Layout
   */
  walkthrough<R extends DynamicViewFlow.AnyStep = DynamicViewFlow.AnyStep>(
    callback: WalkCallback<V, R>,
  ): R | undefined {
    return walkthroughFlow(this.view, callback)
  }

  /**
   * Returns all steps that come before the given step in the flow.
   * @param step The step to find predecessors for.
   * @returns An array of step paths that come before the given step.
   */
  stepsBefore(step: scalar.StepPath): scalar.StepPath[] {
    return stepsBefore(this.view, step)
  }
}

/**
 * Returns all steps that come before the given step in the flow.
 */
export function stepsBefore(view: ProcessedDynamicView<any>, _step: scalar.StepPath): scalar.StepPath[] {
  const ops = dynamicViewFlow(view)

  const inside = isInside(_step)

  const result: scalar.StepPath[] = []

  ops.walkthrough({
    step: ({ step, stopAndReturn }) => {
      if (step === _step) {
        stopAndReturn()
      }
      result.push(step)
    },
    subflow: ({ subflow, stopAndReturn }) => {
      if (subflow.id === _step) {
        return stopAndReturn()
      }
      if (subflow._type === 'alt' || subflow._type === 'try') {
        const branches = [...subflow.flow]
        if (inside(subflow)) {
          return {
            next: find(branches, f => inside(f)),
          }
        }

        return {
          next: first(branches),
        }
      }
      return true
    },
    // subflow: {
    //   ...walkthroughFlow.onSubflows(['alt', 'try'], ({ subflow, stopAndReturn }) => {
    //     if (subflow.id === _step) {
    //       return stopAndReturn()
    //     }
    //     const branches = [...subflow.flow]
    //     const next = find([...subflow.flow], f => inside(f))
    //       ?? first(filter(branches, flowHelpers.hasSteps))
    //     if (next) {
    //       return { next }
    //     }
    //     return false
    //   }),

    // },
  })
  return result
}
