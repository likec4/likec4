import { findAscendingConnections } from '../../model/connection'
import { difference, intersection, isIterable } from '../../utils'
import type { AnyCtx, GenericCtx, StageExclude } from './_types'

export abstract class AbstractStageExclude<T extends AnyCtx = GenericCtx> implements StageExclude<T> {
  // Removed elements
  protected excluded = {
    elements: new Set<T['Element']>(),
    connections: [] as T['Connection'][]
  }

  constructor(
    public readonly memory: T['Memory']
  ) {
  }

  protected _removeElement(element: T['Element']): void {
    this.excluded.elements.add(element)
  }

  public exclude(element: T['Element'] | Iterable<T['Element']> | false | undefined | null): this {
    if (!element) {
      return this
    }
    if (isIterable(element)) {
      for (const el of element) {
        this._removeElement(el)
      }
      return this
    }
    this._removeElement(element)
    return this
  }

  protected _removeConnection(connection: T['Connection']): void {
    this.excluded.connections.push(connection)
  }

  public excludeConnections(connection: T['Connection'] | Iterable<T['Connection']>): this {
    if (isIterable(connection)) {
      for (const c of connection) {
        this._removeConnection(c)
      }
      return this
    }
    this._removeConnection(connection)
    return this
  }

  public isDirty(): boolean {
    return this.excluded.elements.size > 0 || this.excluded.connections.length > 0
  }

  public isEmpty(): boolean {
    return !this.isDirty()
  }

  protected processExcludedElements(
    excluded: Set<T['Element']>,
    state: T['MutableState']
  ): T['MutableState'] {
    state.elements = difference(state.elements, excluded)
    state.explicits = difference(state.explicits, excluded)
    state.final = difference(state.final, excluded)

    const excludedConnections = state.connections
      .filter(c => excluded.has(c.source) || excluded.has(c.target))

    const ascConnections = excludedConnections.flatMap(c =>
      findAscendingConnections(state.connections, c).map(asc => asc.intersect(c) as T['Connection'])
    )
    if (excludedConnections.length > 0) {
      return this.processExcludeConnections([
        ...excludedConnections,
        ...ascConnections
      ], state)
    }
    return state
  }

  protected processExcludeConnections(
    excluded: T['Connection'][],
    state: T['MutableState']
  ): T['MutableState'] {
    if (excluded.length === 0) {
      return state
    }

    const excludedMap = excluded.reduce((acc, c) => {
      const existing = acc.get(c.id)
      if (existing) {
        acc.set(c.id, existing.mergeWith(c) as T['Connection'])
      } else {
        acc.set(c.id, c)
      }
      return acc
    }, new Map<string, T['Connection']>())

    // were connected before and not anymore
    let excludedElements = new Set<T['Element']>()

    state.connections = state.connections.reduce((acc, c) => {
      const excluded = excludedMap.get(c.id)
      if (excluded) {
        excludedElements.add(c.source)
        excludedElements.add(c.target)
        const diff = c.difference(excluded) as T['Connection']
        if (diff.nonEmpty()) {
          acc.push(diff)
        }
      } else {
        acc.push(c)
      }
      return acc
    }, [] as T['Connection'][])

    for (const stillExists of state.connections) {
      excludedElements.delete(stillExists.source)
      excludedElements.delete(stillExists.target)
    }

    if (excludedElements.size === 0) {
      return state
    }

    // Check if EXPLICIT elements are becoming IMPLICIT
    // (it means that they are not connected anymore)
    const explicitsBecomingImplicit = intersection(state.explicits, excludedElements)
    if (explicitsBecomingImplicit.size > 0) {
      state.explicits = difference(state.explicits, explicitsBecomingImplicit)
      // Exclude from final elements
      state.final = difference(state.final, excludedElements)

      // Exclude from elements (but keep implicits)
      state.elements = difference(
        state.elements,
        difference(excludedElements, explicitsBecomingImplicit)
      )
      return state
    }

    state.elements = difference(state.elements, excludedElements)
    state.final = difference(state.final, excludedElements)

    return state
  }

  public commit(): T['Memory'] {
    let state = this.memory.mutableState()

    if (this.excluded.elements.size > 0) {
      state = this.processExcludedElements(this.excluded.elements, state)
    }
    if (this.excluded.connections.length > 0) {
      state = this.processExcludeConnections(this.excluded.connections, state)
    }

    return this.memory.update(state)
  }
}
