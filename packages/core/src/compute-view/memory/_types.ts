import type { Connection } from '../../model/connection'
import type { DeploymentElementModel } from '../../model/DeploymentElementModel'
import type { ElementModel } from '../../model/ElementModel'

type Element = ElementModel | DeploymentElementModel

export interface ComputeCtx<
  E extends Element,
  C extends Connection<E, any>,
  M extends ComputeMemory<any>,
  Inc extends StageInclude<any>,
  Exc extends StageExclude<any>,
  Expr = unknown,
> {
  Element: E
  Connection: C
  Memory: M
  StageInclude: Inc
  StageExclude: Exc
  Expr: Expr
  MutableState: State<this>
}

// export type AnyCtx = ComputeCtx<any, any, ComputeMemory<any>, StageInclude<any>, StageExclude<any>, any>
export type AnyCtx = GenericCtx

export type GenericCtx = ComputeCtx<
  Element,
  Connection<Element, any>,
  ComputeMemory<GenericCtx>,
  StageInclude<GenericCtx>,
  StageExclude<GenericCtx>,
  unknown
>

export interface State<T extends AnyCtx> {
  elements: Set<CtxElement<T>>
  explicits: Set<CtxElement<T>>
  final: Set<CtxElement<T>>
  connections: Array<CtxConnection<T>>
}

export type MutableState<T extends AnyCtx> = T['MutableState']

export type StageExpression<T extends AnyCtx> = T['Expr']

export type CtxElement<T extends AnyCtx> = T['Element']
export type CtxConnection<T extends AnyCtx> = T['Connection']
export type CtxMemory<T extends AnyCtx> = T['Memory']

export interface ComputeMemory<T extends AnyCtx> {
  /**
   * All resolved elements, includes:
   * - explicit elements (included by element predicates, always appear in the view unless excluded)
   * - elements from resolved connections (may be excluded, if connection is redundant @see excludeRedundantRelationships
   * - implicit elements (not added directly, not included in the view, used for resolving connections)
   */
  readonly elements: ReadonlySet<CtxElement<T>>

  /**
   * Explicit elements
   */
  readonly explicits: ReadonlySet<CtxElement<T>>

  /**
   * Final set of elements to be included in the view
   * (`elements` excluding implicits)
   * Keeps order in which elements were added
   */
  readonly final: ReadonlySet<CtxElement<T>>

  /**
   * Resolved connections
   */
  readonly connections: ReadonlyArray<CtxConnection<T>>

  isEmpty(): boolean

  stageInclude(expression: T['Expr']): T['StageInclude']

  stageExclude(expression: T['Expr']): T['StageExclude']

  /**
   * Returns shallow copy of state
   */
  mutableState(): T['MutableState']

  /**
   * Returns new memory with updated state
   */
  update(newstate: Partial<T['MutableState']>): T['Memory']
}

interface Stage<T extends AnyCtx> {
  readonly memory: CtxMemory<T>

  readonly expression: StageExpression<T>

  /**
   * Has changes
   */
  isDirty(): boolean

  /**
   * Has no changes
   */
  isEmpty(): boolean

  commit(): T['Memory']
}

export interface StageInclude<T extends AnyCtx> extends Stage<T> {
  readonly elements: ReadonlySet<CtxElement<T>>

  readonly connections: ReadonlyArray<CtxConnection<T>>

  addExplicit(element: CtxElement<T> | Iterable<CtxElement<T>> | false | undefined | null): this

  addImplicit(element: CtxElement<T> | Iterable<CtxElement<T>> | false | undefined | null): this

  /**
   * Connects element with existing ones in the memory
   *
   * @param direction - direction of the connection
   * @default 'both'
   */
  connectWithExisting(
    element: CtxElement<T> | Iterable<CtxElement<T>>,
    direction?: 'in' | 'out' | 'both',
  ): boolean

  addConnections(connection: CtxConnection<T> | Iterable<CtxConnection<T>>): this
}

export interface StageExclude<T extends AnyCtx> extends Stage<T> {
  /**
   * Excludes from the memory relationships from given connections (still connection may be included, but without given relationships)
   * @param moveExplicitToImplicit - if true, disconnected explicit elements will be moved to implicit
   * @default false
   */
  excludeConnections(
    connection: CtxConnection<T> | Iterable<CtxConnection<T>>,
    moveExplicitToImplicit?: boolean,
  ): this

  exclude(element: CtxElement<T> | Iterable<CtxElement<T>> | false | undefined | null): this
}
