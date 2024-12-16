import { partition } from 'remeda'
import { mergeConnections } from '../../model/connection'
import { isIterable, union } from '../../utils'
import type { AnyCtx, GenericCtx, StageInclude } from './_types'

export abstract class AbstractStageInclude<T extends AnyCtx = GenericCtx> implements StageInclude<T> {
  // New elements
  protected explicits = new Set<T['Element']>()
  protected implicits = new Set<T['Element']>()
  protected connections = [] as T['Connection'][]

  constructor(
    public readonly memory: T['Memory']
  ) {
  }

  get newElements(): ReadonlySet<T['Element']> {
    return this.explicits
  }

  get newConnections(): readonly T['Connection'][] {
    return this.connections
  }

  abstract connectWithExisting(
    element: T['Element'] | Iterable<T['Element']>,
    direction?: 'in' | 'out' | 'both'
  ): boolean

  /**
   * Possible to override
   */
  protected _addExplicit(elements: T['Element']): void {
    this.explicits.add(elements)
    this.implicits.delete(elements)
  }

  public addExplicit(element: T['Element'] | Iterable<T['Element']> | false | undefined | null): this {
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
  protected _addImplicit(elements: T['Element']): void {
    if (this.explicits.has(elements)) {
      return
    }
    this.implicits.add(elements)
  }

  public addImplicit(elements: T['Element'] | Iterable<T['Element']> | false | undefined | null): this {
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
  protected _addConnection(connection: T['Connection']): void {
    this.connections.push(connection)
    this._addImplicit(connection.source)
    this._addImplicit(connection.target)
  }

  public addConnections(connection: T['Connection'] | Iterable<T['Connection']>): this {
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
    return this.explicits.size > 0 || this.implicits.size > 0 || this.connections.length > 0
  }

  public isEmpty(): boolean {
    return !this.isDirty()
  }

  /**
   * Precommit hook
   */
  protected precommit(state: T['MutableState']): T['MutableState'] {
    return state
  }

  /**
   * Postcommit hook
   */
  protected postcommit(state: T['MutableState']): T['MutableState'] {
    return state
  }

  public commit(): T['Memory'] {
    let state = this.precommit(this.memory.mutableState())

    let fromConnections = new Set<T['Element']>()

    if (this.connections.length > 0) {
      // To preserve order, we split new connections into two sets
      // First are outgoing from known elements (in memory.elements)
      const [fromKnown, rest] = partition(
        this.connections,
        c => state.final.has(c.source)
      )

      state.connections = mergeConnections([
        ...state.connections,
        ...fromKnown,
        ...rest
      ])

      fromConnections = new Set([
        // we have source in memory.elements
        ...fromKnown.map(c => c.target),
        ...rest.flatMap(c => [c.source, c.target])
      ])
    }

    state.explicits = union(
      state.explicits,
      this.explicits
    )

    state.final = union(
      state.final,
      this.explicits,
      fromConnections
    )

    state.elements = union(
      state.elements,
      this.explicits,
      fromConnections,
      this.implicits
    )

    return this.memory.update(this.postcommit(state))
  }
}
