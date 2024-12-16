import type { Connection } from '../../model/connection'
import type { DeploymentElementModel } from '../../model/DeploymentElementModel'
import type { ElementModel } from '../../model/ElementModel'

type Element = ElementModel | DeploymentElementModel

export interface ComputeCtx<
  E extends Element,
  C extends Connection<E, any>,
  M extends ComputeMemory<any>,
  Inc extends StageInclude<any>,
  Exc extends StageExclude<any>
> {
  Element: E
  Connection: C
  Memory: M
  StageInclude: Inc
  StageExclude: Exc

  MutableState: MutableState<this>
}

export type AnyCtx = ComputeCtx<any, any, ComputeMemory<any>, StageInclude<any>, StageExclude<any>>

export type GenericCtx = ComputeCtx<
  Element,
  Connection<Element, any>,
  ComputeMemory<GenericCtx>,
  StageInclude<GenericCtx>,
  StageExclude<GenericCtx>
>

interface MutableState<T extends AnyCtx> {
  elements: Set<T['Element']>
  explicits: Set<T['Element']>
  final: Set<T['Element']>
  connections: Array<T['Connection']>
}

export interface ComputeMemory<T extends AnyCtx> {
  /**
   * All resolved elements, includes:
   * - explicit elements (included by element predicates, always appear in the view unless excluded)
   * - elements from resolved connections (may be excluded, if connection is redundant @see excludeRedundantRelationships
   * - implicit elements (not added directly, not included in the view, used for resolving connections)
   */
  readonly elements: ReadonlySet<T['Element']>

  /**
   * Explicit elements
   */
  readonly explicits: ReadonlySet<T['Element']>

  /**
   * Final set of elements to be included in the view
   * (`elements` excluding implicits)
   * Keeps order in which elements were added
   */
  readonly final: ReadonlySet<T['Element']>

  /**
   * Resolved connections
   */
  readonly connections: ReadonlyArray<T['Connection']>

  isEmpty(): boolean

  clone(): T['Memory']

  stageInclude(): T['StageInclude']

  stageExclude(): T['StageExclude']

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
  readonly memory: T['Memory']

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
  readonly newElements: ReadonlySet<T['Element']>

  readonly newConnections: ReadonlyArray<T['Connection']>

  addExplicit(element: T['Element'] | Iterable<T['Element']> | false | undefined | null): this

  addImplicit(element: T['Element'] | Iterable<T['Element']> | false | undefined | null): this

  /**
   * Connects element with existing ones in the memory
   *
   * @param direction - direction of the connection
   * @default 'both'
   */
  connectWithExisting(
    element: T['Element'] | Iterable<T['Element']>,
    direction?: 'in' | 'out' | 'both'
  ): boolean

  addConnections(connection: T['Connection'] | Iterable<T['Connection']>): this
}

export interface StageExclude<T extends AnyCtx> extends Stage<T> {
  excludeConnections(connection: T['Connection'] | Iterable<T['Connection']>): this

  exclude(element: T['Element'] | Iterable<T['Element']> | false | undefined | null): this
}
