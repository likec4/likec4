import { isBoolean, pipe } from 'remeda'
import { invariant } from '../../errors'
import { findAscendingConnections } from '../../model/connection'
import { difference, intersection, isDescendantOf, isIterable } from '../../utils'
import { ifilter, isome, toSet } from '../../utils/iterable'
import type { AnyCtx, CtxConnection, CtxElement, MutableState, StageExclude, StageExpression } from './_types'

export abstract class AbstractStageExclude<T extends AnyCtx> implements StageExclude<T> {
  // Removed elements
  protected excluded = {
    elements: new Set<CtxElement<T>>(),
    connections: [] as CtxConnection<T>[],
  }

  constructor(
    public readonly memory: T['Memory'],
    public readonly expression: StageExpression<T>,
  ) {
  }

  protected markedToMoveExplicitToImplicit = false

  protected _removeElement(element: CtxElement<T>): void {
    this.excluded.elements.add(element)
  }

  public exclude(element: CtxElement<T> | Iterable<CtxElement<T>> | false | undefined | null): this {
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

  protected _removeConnection(connection: CtxConnection<T>): void {
    this.excluded.connections.push(connection)
  }
  /**
   * Excludes from the memory relationships from given connections (still connection may be included, but without given relationships)
   * @param moveExplicitToImplicit - if true, disconnected explicit elements will be moved to implicit
   * @default false
   */
  public excludeConnections(
    connection: CtxConnection<T> | Iterable<CtxConnection<T>>,
    moveExplicitToImplicit?: boolean,
  ) {
    if (isBoolean(moveExplicitToImplicit)) {
      invariant(!this.markedToMoveExplicitToImplicit, 'Already marked to move explicits')
      this.markedToMoveExplicitToImplicit = moveExplicitToImplicit
    }
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

  /**
   * Determines whether disconnected explicits should become implicits.
   * By default moves all disconnected explicits to implicits, if there were operation to exclude elements.
   *
   * Override this method to change the behavior.
   */
  protected filterForMoveToImplicits(disconnectedExplicits: Set<CtxElement<T>>): Set<CtxElement<T>> {
    if (this.markedToMoveExplicitToImplicit || this.excluded.elements.size > 0) {
      return disconnectedExplicits
    }
    return new Set()
  }

  // Check if Leaf EXPLICIT elements are becoming IMPLICIT
  // (it means that they are not connected anymore)
  protected moveDisconnectedExplicitsToImplicits(state: MutableState<T>): MutableState<T> {
    // Check if EXPLICIT elements are becoming IMPLICIT
    let disconnected = difference(
      new Set(this.memory.connections.flatMap(c => [c.source, c.target])),
      new Set(state.connections.flatMap(c => [c.source, c.target])),
    )
    // Ensure existing in implicits
    disconnected = intersection(
      disconnected,
      state.elements,
    )
    // Ensure this is a leaf explici element
    disconnected = pipe(
      disconnected,
      ifilter(el => {
        return state.explicits.has(el) && !isome(state.final, isDescendantOf(el))
      }),
      toSet(),
    )
    if (disconnected.size > 0) {
      disconnected = this.filterForMoveToImplicits(disconnected)
      state.explicits = difference(state.explicits, disconnected)
      // Exclude from final elements
      state.final = difference(state.final, disconnected)
    }
    return state
  }

  protected removeElements(state: MutableState<T>): MutableState<T> {
    state.elements = difference(state.elements, this.excluded.elements)
    state.explicits = difference(state.explicits, this.excluded.elements)
    state.final = difference(state.final, this.excluded.elements)
    return state
  }

  protected removeConnections(state: MutableState<T>): MutableState<T> {
    const excludedMap = this.excluded.connections.reduce((acc, c) => {
      const existing = acc.get(c.id)
      if (existing) {
        acc.set(c.id, existing.mergeWith(c) as CtxConnection<T>)
      } else {
        acc.set(c.id, c)
      }
      return acc
    }, new Map<string, CtxConnection<T>>())

    // were connected before and not anymore
    let disconnected = new Set<CtxElement<T>>()

    state.connections = state.connections.reduce((acc, c) => {
      const excluded = excludedMap.get(c.id)
      if (excluded) {
        disconnected.add(c.source)
        disconnected.add(c.target)
        const diff = c.difference(excluded) as CtxConnection<T>
        if (diff.nonEmpty()) {
          acc.push(diff)
        }
      } else {
        acc.push(c)
      }
      return acc
    }, [] as CtxConnection<T>[])

    for (const stillExists of state.connections) {
      disconnected.delete(stillExists.source)
      disconnected.delete(stillExists.target)
      if (stillExists.boundary && state.elements.has(stillExists.boundary)) {
        disconnected.delete(stillExists.boundary)
      }
    }

    if (disconnected.size === 0) {
      return state
    }
    // Keep explicits
    disconnected = difference(disconnected, state.explicits)
    // Even if not connected, implicit elements should be kept
    // state.elements = difference(state.elements, excludedElements)
    state.final = difference(state.final, disconnected)

    return state
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
    invariant(difference(state.explicits, state.elements).size === 0, 'Explicits must be subset of elements')
    invariant(difference(state.final, state.elements).size === 0, 'Final elements must be subset of elements')
    return state
  }

  public commit(): T['Memory'] {
    let state = this.precommit(this.memory.mutableState())

    // Exclude connections from excluded elements
    if (this.excluded.elements.size > 0) {
      const excludedConnections = state.connections
        .filter(c => this.excluded.elements.has(c.source) || this.excluded.elements.has(c.target))
        .flatMap(c => [
          c,
          ...findAscendingConnections(state.connections, c)
            .map(asc => asc.intersect(c) as CtxConnection<T>),
        ])
        .filter(asc => asc.nonEmpty())
      this.excludeConnections(excludedConnections)
    }
    if (this.excluded.connections.length > 0) {
      state = this.removeConnections(state)
    }
    if (this.excluded.elements.size > 0) {
      state = this.removeElements(state)
    }

    state = this.moveDisconnectedExplicitsToImplicits(state)

    return this.memory.update(this.postcommit(state))
  }
}
