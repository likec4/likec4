import { partition } from 'remeda'
import { mergeConnections } from '../../model/connection'
import { intersection, isIterable, union } from '../../utils'
import type {
  AnyCtx,
  CtxConnection as Connection,
  CtxElement as Elem,
  GenericCtx,
  MutableState,
  StageExpression,
  StageInclude,
} from './_types'

export abstract class AbstractStageInclude<T extends AnyCtx = GenericCtx> implements StageInclude<T> {
  // New elements
  protected explicits = new Set<Elem<T>>()
  protected implicits = new Set<Elem<T>>()
  protected _connections = [] as Connection<T>[]

  constructor(
    public readonly memory: T['Memory'],
    public readonly expression: StageExpression<T>,
  ) {
  }

  get elements(): ReadonlySet<Elem<T>> {
    return this.explicits
  }

  /**
   * Connections from this stage
   */
  get connections(): readonly Connection<T>[] {
    return this._connections
  }

  mergedConnections(): readonly Connection<T>[] {
    return mergeConnections([
      ...this.memory.connections,
      ...this._connections,
    ])
  }

  public connectWithExisting(
    _element: Elem<T> | Iterable<Elem<T>>,
    _direction?: 'in' | 'out' | 'both',
  ): boolean {
    throw new Error('Method not implements, depends on the model')
  }

  /**
   * Possible to override
   */
  protected _addExplicit(elements: Elem<T>): void {
    this.explicits.add(elements)
    this.implicits.delete(elements)
  }

  public addExplicit(element: Elem<T> | Iterable<Elem<T>> | false | undefined | null): this {
    if (!element) {
      return this
    }
    if (isIterable(element)) {
      for (const el of element) {
        this._addExplicit(el)
      }
      return this
    }
    this._addExplicit(element)
    return this
  }

  /**
   * Possible to override
   */
  protected _addImplicit(elements: Elem<T>): void {
    if (this.explicits.has(elements)) {
      return
    }
    this.implicits.add(elements)
  }

  public addImplicit(elements: Elem<T> | Iterable<Elem<T>> | false | undefined | null): this {
    if (!elements) {
      return this
    }
    if (isIterable(elements)) {
      for (const el of elements) {
        this._addImplicit(el)
      }
      return this
    }
    this._addImplicit(elements)
    return this
  }

  /**
   * Possible to override
   */
  protected _addConnection(connection: Connection<T>): void {
    this._connections.push(connection)
    this._addImplicit(connection.source)
    this._addImplicit(connection.target)
  }

  public addConnections(connection: Connection<T> | Iterable<Connection<T>>): this {
    if (isIterable(connection)) {
      for (const c of connection) {
        this._addConnection(c)
      }
      return this
    }
    this._addConnection(connection)
    return this
  }

  public isDirty(): boolean {
    return this.explicits.size > 0 || this.implicits.size > 0 || this._connections.length > 0
  }

  public isEmpty(): boolean {
    return !this.isDirty()
  }

  /**
   * Precommit hook
   */
  protected precommit(state: MutableState<T>): MutableState<T> {
    return state
  }

  /**
   * Postcommit hook
   */
  protected postcommit(state: MutableState<T>): MutableState<T> {
    return state
  }

  protected processConnections(connections: Connection<T>[]): Connection<T>[] { // To preserve order, we split new connections into two sets
    return connections
  }

  public commit(): T['Memory'] {
    let state = this.precommit(this.memory.mutableState())

    let fromConnections = new Set<Elem<T>>()

    if (this._connections.length > 0) {
      // To preserve order, we split new connections into two sets
      // First are outgoing from known elements (in memory.elements)
      const [fromKnown, rest] = partition(
        this._connections,
        c => state.final.has(c.source),
      )

      state.connections = this.processConnections(
        mergeConnections([
          ...state.connections,
          ...fromKnown,
          ...rest,
        ]),
      )

      fromConnections = new Set(state.connections.flatMap(c => [c.source, c.target]))
    }

    state.elements = union(
      state.elements,
      this.explicits,
      fromConnections,
      this.implicits,
    )

    state.explicits = intersection(
      state.elements,
      union(
        state.explicits,
        this.explicits,
      ),
    )

    state.final = intersection(
      state.elements,
      union(
        state.final,
        this.explicits,
        fromConnections,
      ),
    )

    return this.memory.update(this.postcommit(state))
  }
}
